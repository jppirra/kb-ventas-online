package com.jafpsoft.ventas.dto.catalog;

import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CatalogResponse {
    private Long id;
    private String publicId;
    private String name;
    private String description;
    private String aiContent;
    private CatalogStatus status;
    private String viewMode;
    private String backgroundType;
    private String backgroundColor;
    private String backgroundImageUrl;
    private Long backgroundTemplateId;
    private Long storeId;
    private int productCount;
    private Long viewCount;
    private List<ProductResponse> products;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CatalogResponse from(Catalog c, boolean includeProducts) {
        CatalogResponse r = new CatalogResponse();
        r.id = c.getId();
        r.publicId = c.getPublicId();
        r.name = c.getName();
        r.description = c.getDescription();
        r.aiContent = c.getAiContent();
        r.status = c.getStatus();
        r.viewMode = c.getViewMode();
        r.backgroundType = c.getBackgroundType();
        r.backgroundColor = c.getBackgroundColor();
        r.backgroundImageUrl = c.getBackgroundImageUrl();
        r.backgroundTemplateId = c.getBackgroundTemplateId();
        r.storeId = c.getStoreId();
        r.productCount = c.getProductCount();
        r.viewCount = c.getViewCount();
        r.createdAt = c.getCreatedAt();
        r.updatedAt = c.getUpdatedAt();
        if (includeProducts) {
            r.products = c.getProducts().stream()
                    .map(ProductResponse::from)
                    .toList();
        }
        return r;
    }
}
