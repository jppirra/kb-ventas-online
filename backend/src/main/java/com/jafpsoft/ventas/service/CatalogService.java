package com.jafpsoft.ventas.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.dto.catalog.CatalogRequest;
import com.jafpsoft.ventas.dto.catalog.CatalogResponse;
import com.jafpsoft.ventas.dto.catalog.ProductRequest;
import com.jafpsoft.ventas.dto.catalog.ProductResponse;
import com.jafpsoft.ventas.dto.profile.CatalogSnapshotData;
import com.jafpsoft.ventas.dto.profile.PublicProductResponse;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogStatus;
import com.jafpsoft.ventas.model.Product;
import com.jafpsoft.ventas.model.CatalogCollaborator;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CollaboratorService collaboratorService;
    private final ExcelService excelService;
    private final AiService aiService;
    private final StorageService storageService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<CatalogResponse> listByUser(Long userId) {
        List<CatalogResponse> own = catalogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(Catalog::isActive)
                .map(c -> CatalogResponse.from(c, false))
                .toList();

        List<Long> collabIds = collaboratorService.getAccessibleCatalogIds(userId);
        List<CatalogResponse> collab = collabIds.stream()
                .map(cid -> catalogRepository.findById(cid).orElse(null))
                .filter(Objects::nonNull)
                .filter(Catalog::isActive)
                .filter(c -> !c.getUserId().equals(userId))
                .map(c -> {
                    CatalogResponse r = CatalogResponse.from(c, false);
                    CatalogCollaborator cc = collaboratorService.getActiveCollaboratorForCatalog(c.getId(), userId);
                    r.setCollaboratorCanPublish(cc != null ? cc.isCanPublish() : null);
                    return r;
                })
                .toList();

        return Stream.concat(own.stream(), collab.stream()).toList();
    }

    @Transactional(readOnly = true)
    public CatalogResponse getById(Long id, Long userId) {
        Catalog catalog = findAccessible(id, userId, false);
        CatalogResponse r = CatalogResponse.from(catalog, true);
        if (!catalog.getUserId().equals(userId) && !isAdmin(userId)) {
            CatalogCollaborator cc = collaboratorService.getActiveCollaboratorForCatalog(id, userId);
            r.setCollaboratorCanPublish(cc != null ? cc.isCanPublish() : null);
        }
        return r;
    }

    @Transactional
    public CatalogResponse create(CatalogRequest req, Long userId) {
        Catalog catalog = Catalog.builder()
                .userId(userId)
                .publicId(UUID.randomUUID().toString())
                .name(req.getName())
                .description(req.getDescription())
                .build();
        applyAppearance(catalog, req);
        return CatalogResponse.from(catalogRepository.save(catalog), false);
    }

    @Transactional
    public CatalogResponse update(Long id, CatalogRequest req, Long userId) {
        Catalog catalog = findAccessible(id, userId, false);
        catalog.setName(req.getName());
        catalog.setDescription(req.getDescription());
        applyAppearance(catalog, req);
        if (catalog.getPublishedSnapshotJson() != null) catalog.setHasDraftChanges(true);
        return CatalogResponse.from(catalogRepository.save(catalog), true);
    }

    private void applyAppearance(Catalog catalog, CatalogRequest req) {
        if (req.getRubro() != null) catalog.setRubro(req.getRubro().isBlank() ? null : req.getRubro());
        if (req.getViewMode() != null) catalog.setViewMode(req.getViewMode());
        if (req.getBackgroundType() != null) catalog.setBackgroundType(req.getBackgroundType());
        if (req.getBackgroundColor() != null) catalog.setBackgroundColor(req.getBackgroundColor());
        if (req.getBackgroundImageUrl() != null) catalog.setBackgroundImageUrl(req.getBackgroundImageUrl());
        if (req.getBackgroundTemplateId() != null) catalog.setBackgroundTemplateId(req.getBackgroundTemplateId());
        if (req.getSizesEnabled() != null) catalog.setSizesEnabled(req.getSizesEnabled());
        if (req.getSizeOptions() != null) catalog.setSizeOptions(req.getSizeOptions());
        if (req.getColorsEnabled() != null) catalog.setColorsEnabled(req.getColorsEnabled());
        if (req.getColorOptions() != null) catalog.setColorOptions(req.getColorOptions());
        if (req.getDiscount() != null) catalog.setDiscount(req.getDiscount() > 0 ? req.getDiscount() : null);
        if (req.getSectionOrder() != null) catalog.setSectionOrder(req.getSectionOrder().isEmpty() ? null : req.getSectionOrder());
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Catalog catalog = findOwned(id, userId);
        // Soft-delete: marca inactivo para que el link público pueda redirigir al perfil del vendedor
        catalog.setActive(false);
        catalogRepository.save(catalog);
    }

    @Transactional
    public ProductResponse addProduct(Long catalogId, ProductRequest req, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        Product product = Product.builder()
                .userId(catalog.getUserId())
                .catalog(catalog)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .sku(req.getSku())
                .category(req.getCategory())
                .imageUrl(req.getImageUrl())
                .extraImagesJson(req.getExtraImagesJson())
                .videoUrl(req.getVideoUrl())
                .sortOrder(req.getSortOrder())
                .active(req.getActive() == null || req.getActive())
                .build();
        applyStockFields(product, req);
        ProductResponse result = ProductResponse.from(productRepository.save(product));
        markDraftChanged(catalog);
        return result;
    }

    @Transactional
    public ProductResponse updateProduct(Long catalogId, Long productId, ProductRequest req, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        Product product = productRepository.findByIdAndCatalogId(productId, catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        product.setSku(req.getSku());
        product.setCategory(req.getCategory());
        product.setImageUrl(req.getImageUrl());
        if (req.getExtraImagesJson() != null) product.setExtraImagesJson(req.getExtraImagesJson());
        if (req.getVideoUrl() != null) product.setVideoUrl(req.getVideoUrl());
        product.setSortOrder(req.getSortOrder());
        if (req.getActive() != null) product.setActive(req.getActive());
        applyStockFields(product, req);
        ProductResponse result = ProductResponse.from(productRepository.save(product));
        markDraftChanged(catalog);
        return result;
    }

    @Transactional
    public ProductResponse toggleProductActive(Long catalogId, Long productId, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        Product product = productRepository.findByIdAndCatalogId(productId, catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        product.setActive(!product.isActive());
        ProductResponse result = ProductResponse.from(productRepository.save(product));
        markDraftChanged(catalog);
        return result;
    }

    @Transactional
    public ProductResponse unlinkProduct(Long catalogId, Long productId, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        Product product = productRepository.findByIdAndCatalogId(productId, catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        product.setCatalog(null);
        product.setActive(true);
        ProductResponse result = ProductResponse.from(productRepository.save(product));
        markDraftChanged(catalog);
        return result;
    }

    @Transactional
    public ProductResponse assignProductToCatalog(Long catalogId, Long productId, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        Product product = productRepository.findByIdAndUserId(productId, catalog.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        product.setCatalog(catalog);
        product.setActive(true);
        ProductResponse result = ProductResponse.from(productRepository.save(product));
        markDraftChanged(catalog);
        return result;
    }

    private void applyStockFields(Product product, ProductRequest req) {
        if (req.getShowStock() != null) product.setShowStock(req.getShowStock());
        if (req.getStockStatus() != null) product.setStockStatus(req.getStockStatus());
        if (req.getStockCount() != null) product.setStockCount(req.getStockCount());
        if (req.getShowStockQuantity() != null) product.setShowStockQuantity(req.getShowStockQuantity());
        if (req.getShowWhenOutOfStock() != null) product.setShowWhenOutOfStock(req.getShowWhenOutOfStock());
        if (req.getSizeStock() != null) product.setSizeStock(req.getSizeStock());
        if (req.getProductSizes() != null) product.setProductSizes(req.getProductSizes());
        if (req.getProductColors() != null) product.setProductColors(req.getProductColors());
        if (req.getStockMatrix() != null) product.setStockMatrix(req.getStockMatrix());
    }

    @Transactional
    public void deleteProduct(Long catalogId, Long productId, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        Product product = productRepository.findByIdAndCatalogId(productId, catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        productRepository.delete(product);
        markDraftChanged(catalog);
    }

    @Transactional
    public List<ProductResponse> importFromExcel(Long catalogId, MultipartFile file, Long userId) throws IOException {
        Catalog catalog = findAccessible(catalogId, userId, false);
        List<ProductRequest> parsed = excelService.parseProducts(file);

        List<Product> products = parsed.stream().map(req -> Product.builder()
                .userId(catalog.getUserId())
                .catalog(catalog)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .sku(req.getSku())
                .category(req.getCategory())
                .sortOrder(req.getSortOrder())
                .active(true)
                .build()
        ).toList();

        productRepository.saveAll(products);
        markDraftChanged(catalog);
        return products.stream().map(ProductResponse::from).toList();
    }

    @Async
    @Transactional
    public void generateAiContent(Long catalogId, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        catalog.setStatus(CatalogStatus.GENERATING);
        catalogRepository.save(catalog);

        try {
            List<Product> products = productRepository.findByCatalogIdOrderBySortOrderAscCreatedAtAsc(catalogId);

            for (Product product : products) {
                String desc = aiService.generateProductDescription(product);
                if (desc != null) {
                    product.setAiDescription(desc);
                    productRepository.save(product);
                }
            }

            String intro = aiService.generateCatalogIntro(catalog.getName(), products);
            catalog.setAiContent(intro);
            catalog.setStatus(CatalogStatus.GENERATED);
            if (catalog.getPublishedSnapshotJson() != null) catalog.setHasDraftChanges(true);
            catalogRepository.save(catalog);
        } catch (Exception e) {
            catalog.setStatus(CatalogStatus.DRAFT);
            catalogRepository.save(catalog);
            throw e;
        }
    }

    @Transactional
    public Map<String, String> uploadTempProductImage(Long catalogId, MultipartFile file, Long userId) throws IOException {
        findAccessible(catalogId, userId, false);
        String url = storageService.uploadImage(file, "products");
        return Map.of("imageUrl", url);
    }

    @Transactional
    public Map<String, String> uploadProductImage(Long catalogId, Long productId, MultipartFile file, Long userId) throws IOException {
        Catalog catalog = findAccessible(catalogId, userId, false);
        Product product = productRepository.findByIdAndCatalogId(productId, catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        String url = storageService.uploadImage(file, "products");
        product.setImageUrl(url);
        productRepository.save(product);
        markDraftChanged(catalog);
        return Map.of("imageUrl", url);
    }

    @Transactional
    public Map<String, String> uploadCatalogBackground(Long catalogId, MultipartFile file, Long userId) throws IOException {
        Catalog catalog = findAccessible(catalogId, userId, false);
        String url = storageService.uploadImage(file, "catalog-backgrounds");
        catalog.setBackgroundImageUrl(url);
        catalog.setBackgroundType("CUSTOM");
        if (catalog.getPublishedSnapshotJson() != null) catalog.setHasDraftChanges(true);
        catalogRepository.save(catalog);
        return Map.of("backgroundImageUrl", url);
    }

    @Transactional
    public Map<String, String> uploadCoverImage(Long catalogId, MultipartFile file, Long userId) throws IOException {
        Catalog catalog = findAccessible(catalogId, userId, false);
        String url = storageService.uploadImage(file, "catalog-covers");
        catalog.setCoverImageUrl(url);
        if (catalog.getPublishedSnapshotJson() != null) catalog.setHasDraftChanges(true);
        catalogRepository.save(catalog);
        return Map.of("coverImageUrl", url);
    }

    @Transactional
    public CatalogResponse publish(Long id, Long userId) {
        Catalog catalog = findAccessible(id, userId, true);
        List<Product> activeProducts = productRepository
                .findByCatalogIdOrderBySortOrderAscCreatedAtAsc(id)
                .stream()
                .filter(Product::isActive)
                .filter(p -> !(p.isShowStock() && "IN_STOCK".equals(p.getStockStatus())
                        && p.getStockCount() != null && p.getStockCount() <= 0
                        && !p.isShowWhenOutOfStock()))
                .toList();

        CatalogSnapshotData snapshot = new CatalogSnapshotData();
        snapshot.setRubro(catalog.getRubro());
        snapshot.setName(catalog.getName());
        snapshot.setDescription(catalog.getDescription());
        snapshot.setAiContent(catalog.getAiContent());
        snapshot.setCoverImageUrl(catalog.getCoverImageUrl());
        snapshot.setViewMode(catalog.getViewMode());
        snapshot.setBackgroundType(catalog.getBackgroundType());
        snapshot.setBackgroundColor(catalog.getBackgroundColor());
        snapshot.setBackgroundImageUrl(catalog.getBackgroundImageUrl());
        snapshot.setDiscount(catalog.getDiscount());
        snapshot.setSectionOrder(catalog.getSectionOrder());
        snapshot.setProducts(activeProducts.stream().map(PublicProductResponse::from).toList());

        try {
            catalog.setPublishedSnapshotJson(objectMapper.writeValueAsString(snapshot));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error al serializar snapshot", e);
        }
        catalog.setPublishedAt(LocalDateTime.now());
        catalog.setHasDraftChanges(false);
        return CatalogResponse.from(catalogRepository.save(catalog), false);
    }

    @Transactional
    public CatalogResponse createFromStock(String name, List<Long> productIds, Long userId) {
        Catalog catalog = Catalog.builder()
                .userId(userId)
                .publicId(UUID.randomUUID().toString())
                .name(name)
                .build();
        catalogRepository.save(catalog);
        for (Long pid : productIds) {
            productRepository.findByIdAndUserId(pid, userId).ifPresent(p -> {
                p.setCatalog(catalog);
                p.setActive(true);
                productRepository.save(p);
            });
        }
        return CatalogResponse.from(catalogRepository.findById(catalog.getId())
                .orElseThrow(), false);
    }

    @Transactional
    public void renameCategory(Long catalogId, String from, String to, Long userId) {
        if (from == null || from.isBlank() || to == null || to.isBlank() || from.trim().equals(to.trim())) return;
        String oldName = from.trim();
        String newName = to.trim();
        Catalog catalog = findAccessible(catalogId, userId, false);

        productRepository.findByCatalogIdOrderBySortOrderAscCreatedAtAsc(catalogId).forEach(p -> {
            if (p.getCategory() == null) return;
            String updated = java.util.Arrays.stream(p.getCategory().split(","))
                .map(String::trim)
                .map(c -> c.equals(oldName) ? newName : c)
                .filter(c -> !c.isEmpty())
                .collect(java.util.stream.Collectors.joining(", "));
            if (!updated.equals(p.getCategory())) {
                p.setCategory(updated);
                productRepository.save(p);
            }
        });

        if (catalog.getSectionOrder() != null) {
            try {
                List<String> sections = objectMapper.readValue(catalog.getSectionOrder(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
                List<String> updated = sections.stream()
                    .map(s -> s.equals(oldName) ? newName : s)
                    .collect(java.util.stream.Collectors.toList());
                catalog.setSectionOrder(objectMapper.writeValueAsString(updated));
                catalogRepository.save(catalog);
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public void reorderProducts(Long catalogId, List<Map<String, Object>> order, Long userId) {
        findAccessible(catalogId, userId, false);
        for (Map<String, Object> item : order) {
            Long productId = Long.valueOf(item.get("id").toString());
            Integer sortOrder = Integer.valueOf(item.get("sortOrder").toString());
            productRepository.findByIdAndCatalogId(productId, catalogId).ifPresent(p -> {
                p.setSortOrder(sortOrder);
                productRepository.save(p);
            });
        }
    }

    @Transactional
    public CatalogResponse revertToPublished(Long catalogId, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        if (catalog.getPublishedSnapshotJson() == null) {
            throw new IllegalStateException("El catálogo no tiene una versión publicada a la que revertir");
        }
        CatalogSnapshotData snapshot;
        try {
            snapshot = objectMapper.readValue(catalog.getPublishedSnapshotJson(), CatalogSnapshotData.class);
        } catch (Exception e) {
            throw new RuntimeException("Error al leer snapshot publicado", e);
        }
        // Restore catalog metadata from snapshot
        catalog.setName(snapshot.getName());
        catalog.setDescription(snapshot.getDescription());
        catalog.setAiContent(snapshot.getAiContent());
        catalog.setCoverImageUrl(snapshot.getCoverImageUrl());
        catalog.setRubro(snapshot.getRubro());
        catalog.setViewMode(snapshot.getViewMode());
        catalog.setBackgroundType(snapshot.getBackgroundType());
        catalog.setBackgroundColor(snapshot.getBackgroundColor());
        catalog.setBackgroundImageUrl(snapshot.getBackgroundImageUrl());
        catalog.setDiscount(snapshot.getDiscount());
        catalog.setSectionOrder(snapshot.getSectionOrder());

        // Restore product visibility based on snapshot
        if (snapshot.getProducts() != null) {
            var snapshotIds = snapshot.getProducts().stream()
                    .map(PublicProductResponse::getId).collect(java.util.stream.Collectors.toSet());
            List<Product> current = productRepository.findByCatalogIdOrderBySortOrderAscCreatedAtAsc(catalogId);
            // Products added after publish → hide
            current.forEach(p -> {
                boolean wasPublished = snapshotIds.contains(p.getId());
                if (p.isActive() != wasPublished) {
                    p.setActive(wasPublished);
                    productRepository.save(p);
                }
            });
            // Products in snapshot missing from catalog → relink if still in DB
            var currentIds = current.stream().map(Product::getId).collect(java.util.stream.Collectors.toSet());
            snapshot.getProducts().forEach(sp -> {
                if (!currentIds.contains(sp.getId())) {
                    productRepository.findById(sp.getId()).ifPresent(p -> {
                        p.setCatalog(catalog);
                        p.setActive(true);
                        productRepository.save(p);
                    });
                }
            });
        }
        catalog.setHasDraftChanges(false);
        return CatalogResponse.from(catalogRepository.save(catalog), true);
    }

    private void markDraftChanged(Catalog catalog) {
        if (catalog.getPublishedSnapshotJson() != null && !catalog.isHasDraftChanges()) {
            catalog.setHasDraftChanges(true);
            catalogRepository.save(catalog);
        }
    }

    private Catalog findOwned(Long id, Long userId) {
        return catalogRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
    }

    private Catalog findAccessible(Long id, Long userId, boolean requirePublishPerm) {
        Optional<Catalog> owned = catalogRepository.findByIdAndUserId(id, userId);
        if (owned.isPresent()) return owned.get();
        if (isAdmin(userId)) return catalogRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
        if (collaboratorService.hasAccessToCatalog(id, userId)) {
            if (requirePublishPerm && !collaboratorService.canPublishCatalog(id, userId))
                throw new AccessDeniedException("Sin permiso para publicar");
            return catalogRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
        }
        throw new EntityNotFoundException("Catálogo no encontrado");
    }

    public void checkAccess(Long id, Long userId) {
        findAccessible(id, userId, false);
    }

    public Long getCatalogOwnerId(Long catalogId, Long userId) {
        Catalog catalog = findAccessible(catalogId, userId, false);
        if (catalog.getUserId() == null) throw new EntityNotFoundException("Catálogo sin propietario");
        return catalog.getUserId();
    }

    private boolean isAdmin(Long userId) {
        return userRepository.findById(userId).map(u -> u.isAppAdmin()).orElse(false);
    }
}
