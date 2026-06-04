package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.Product;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PublicProductResponse {
    private Long id;
    private String name;
    private String description;
    private String aiDescription;
    private BigDecimal price;
    private String sku;
    private String category;
    private String imageUrl;
    private Integer sortOrder;
    private Integer stockCount;
    private Long whatsappClicks;

    public static PublicProductResponse from(Product p) {
        PublicProductResponse r = new PublicProductResponse();
        r.id = p.getId();
        r.name = p.getName();
        r.description = p.getDescription();
        r.aiDescription = p.getAiDescription();
        r.price = p.getPrice();
        r.sku = p.getSku();
        r.category = p.getCategory();
        r.imageUrl = p.getImageUrl();
        r.sortOrder = p.getSortOrder();
        r.stockCount = p.getStockCount();
        r.whatsappClicks = p.getWhatsappClicks();
        return r;
    }
}
