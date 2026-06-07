package com.jafpsoft.ventas.dto.catalog;

import com.jafpsoft.ventas.model.Product;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductResponse {
    private Long id;
    private Long userId;
    private Long catalogId;
    private String catalogName;
    private boolean active;
    private String name;
    private String description;
    private String aiDescription;
    private BigDecimal price;
    private String sku;
    private String category;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean showStock;
    private String stockStatus;
    private Integer stockCount;
    private Boolean showStockQuantity;
    private Boolean showWhenOutOfStock;
    private LocalDateTime createdAt;

    public static ProductResponse from(Product p) {
        ProductResponse r = new ProductResponse();
        r.id = p.getId();
        r.userId = p.getUserId();
        r.catalogId = p.getCatalog() != null ? p.getCatalog().getId() : null;
        r.catalogName = p.getCatalog() != null ? p.getCatalog().getName() : null;
        r.active = p.isActive();
        r.name = p.getName();
        r.description = p.getDescription();
        r.aiDescription = p.getAiDescription();
        r.price = p.getPrice();
        r.sku = p.getSku();
        r.category = p.getCategory();
        r.imageUrl = p.getImageUrl();
        r.sortOrder = p.getSortOrder();
        r.showStock = p.isShowStock();
        r.stockStatus = p.getStockStatus();
        r.stockCount = p.getStockCount();
        r.showStockQuantity = p.isShowStockQuantity();
        r.showWhenOutOfStock = p.isShowWhenOutOfStock();
        r.createdAt = p.getCreatedAt();
        return r;
    }
}
