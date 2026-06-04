package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.catalog.CatalogRequest;
import com.jafpsoft.ventas.dto.catalog.CatalogResponse;
import com.jafpsoft.ventas.dto.catalog.ProductRequest;
import com.jafpsoft.ventas.dto.catalog.ProductResponse;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogStatus;
import com.jafpsoft.ventas.model.Product;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final ExcelService excelService;
    private final AiService aiService;

    @Transactional(readOnly = true)
    public List<CatalogResponse> listByUser(Long userId) {
        return catalogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(c -> CatalogResponse.from(c, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public CatalogResponse getById(Long id, Long userId) {
        Catalog catalog = findOwned(id, userId);
        return CatalogResponse.from(catalog, true);
    }

    @Transactional
    public CatalogResponse create(CatalogRequest req, Long userId) {
        Catalog catalog = Catalog.builder()
                .userId(userId)
                .name(req.getName())
                .description(req.getDescription())
                .build();
        return CatalogResponse.from(catalogRepository.save(catalog), false);
    }

    @Transactional
    public CatalogResponse update(Long id, CatalogRequest req, Long userId) {
        Catalog catalog = findOwned(id, userId);
        catalog.setName(req.getName());
        catalog.setDescription(req.getDescription());
        return CatalogResponse.from(catalogRepository.save(catalog), false);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Catalog catalog = findOwned(id, userId);
        catalogRepository.delete(catalog);
    }

    @Transactional
    public ProductResponse addProduct(Long catalogId, ProductRequest req, Long userId) {
        Catalog catalog = findOwned(catalogId, userId);
        Product product = Product.builder()
                .catalog(catalog)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .sku(req.getSku())
                .category(req.getCategory())
                .imageUrl(req.getImageUrl())
                .sortOrder(req.getSortOrder())
                .build();
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long catalogId, Long productId, ProductRequest req, Long userId) {
        findOwned(catalogId, userId);
        Product product = productRepository.findByIdAndCatalogId(productId, catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        product.setSku(req.getSku());
        product.setCategory(req.getCategory());
        product.setImageUrl(req.getImageUrl());
        product.setSortOrder(req.getSortOrder());
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long catalogId, Long productId, Long userId) {
        findOwned(catalogId, userId);
        Product product = productRepository.findByIdAndCatalogId(productId, catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        productRepository.delete(product);
    }

    @Transactional
    public List<ProductResponse> importFromExcel(Long catalogId, MultipartFile file, Long userId) throws IOException {
        Catalog catalog = findOwned(catalogId, userId);
        List<ProductRequest> parsed = excelService.parseProducts(file);

        List<Product> products = parsed.stream().map(req -> Product.builder()
                .catalog(catalog)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .sku(req.getSku())
                .category(req.getCategory())
                .sortOrder(req.getSortOrder())
                .build()
        ).toList();

        productRepository.saveAll(products);
        return products.stream().map(ProductResponse::from).toList();
    }

    @Async
    @Transactional
    public void generateAiContent(Long catalogId, Long userId) {
        Catalog catalog = findOwned(catalogId, userId);
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
            catalogRepository.save(catalog);
        } catch (Exception e) {
            catalog.setStatus(CatalogStatus.DRAFT);
            catalogRepository.save(catalog);
            throw e;
        }
    }

    private Catalog findOwned(Long id, Long userId) {
        return catalogRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
    }
}
