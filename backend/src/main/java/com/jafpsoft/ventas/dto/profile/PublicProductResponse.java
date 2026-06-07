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
    private BigDecimal offerPrice;
    private String sku;
    private String category;
    private String imageUrl;
    private String extraImagesJson;
    private String videoUrl;
    private String variantsJson;
    private Integer sortOrder;
    private Boolean showStock;
    private String stockStatus;
    private Integer stockCount;

    public static PublicProductResponse from(Product p) {
        PublicProductResponse r = new PublicProductResponse();
        r.id = p.getId();
        r.name = p.getName();
        r.description = p.getDescription();
        r.aiDescription = p.getAiDescription();
        r.price = p.getPrice();
        r.offerPrice = p.getOfferPrice();
        r.sku = p.getSku();
        r.category = p.getCategory();
        r.imageUrl = p.getImageUrl();
        r.extraImagesJson = p.getExtraImagesJson();
        r.videoUrl = p.getVideoUrl();
        r.variantsJson = p.getVariantsJson();
        r.sortOrder = p.getSortOrder();
        if (p.isShowStock()) {
            r.showStock = true;
            r.stockStatus = p.getStockStatus();
            if (p.isShowStockQuantity()) {
                r.stockCount = p.getStockCount();
            }
        }
        return r;
    }
}
