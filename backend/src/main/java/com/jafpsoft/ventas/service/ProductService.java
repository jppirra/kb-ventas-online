package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.catalog.ProductRequest;
import com.jafpsoft.ventas.dto.catalog.ProductResponse;
import com.jafpsoft.ventas.model.Product;
import com.jafpsoft.ventas.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<ProductResponse> listByUser(Long userId) {
        return productRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest req, Long userId) {
        Product product = Product.builder()
                .userId(userId)
                .catalog(null)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .sku(req.getSku())
                .category(req.getCategory())
                .imageUrl(req.getImageUrl())
                .sortOrder(req.getSortOrder())
                .active(true)
                .build();
        applyStockFields(product, req);
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long productId, ProductRequest req, Long userId) {
        Product product = findOwned(productId, userId);
        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        product.setSku(req.getSku());
        product.setCategory(req.getCategory());
        product.setImageUrl(req.getImageUrl());
        product.setSortOrder(req.getSortOrder());
        if (req.getActive() != null) product.setActive(req.getActive());
        applyStockFields(product, req);
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void delete(Long productId, Long userId) {
        Product product = findOwned(productId, userId);
        productRepository.delete(product);
    }

    @Transactional
    public Map<String, String> uploadImage(Long productId, MultipartFile file, Long userId) throws IOException {
        Product product = findOwned(productId, userId);
        String url = storageService.uploadImage(file, "products");
        product.setImageUrl(url);
        productRepository.save(product);
        return Map.of("imageUrl", url);
    }

    private void applyStockFields(Product product, ProductRequest req) {
        if (req.getShowStock() != null) product.setShowStock(req.getShowStock());
        if (req.getStockStatus() != null) product.setStockStatus(req.getStockStatus());
        if (req.getStockCount() != null) product.setStockCount(req.getStockCount());
        if (req.getShowStockQuantity() != null) product.setShowStockQuantity(req.getShowStockQuantity());
    }

    private Product findOwned(Long id, Long userId) {
        return productRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
    }
}
