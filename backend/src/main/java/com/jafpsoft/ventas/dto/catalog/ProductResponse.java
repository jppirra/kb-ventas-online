package com.jafpsoft.ventas.dto.catalog;

import com.jafpsoft.ventas.model.Product;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String aiDescription;
    private BigDecimal price;
    private String sku;
    private String category;
    private String imageUrl;
    private Integer sortOrder;
    private LocalDateTime createdAt;

    public static ProductResponse from(Product p) {
        ProductResponse r = new ProductResponse();
        r.id = p.getId();
        r.name = p.getName();
        r.description = p.getDescription();
        r.aiDescription = p.getAiDescription();
        r.price = p.getPrice();
        r.sku = p.getSku();
        r.category = p.getCategory();
        r.imageUrl = p.getImageUrl();
        r.sortOrder = p.getSortOrder();
        r.createdAt = p.getCreatedAt();
        return r;
    }
}
