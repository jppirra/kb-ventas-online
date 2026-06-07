package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.Catalog;
import lombok.Data;

import java.util.List;

@Data
public class PublicCatalogResponse {
    private Long id;
    private String publicId;
    private boolean available = true;
    private String name;
    private String description;
    private String aiContent;
    private String coverImageUrl;
    private String viewMode;
    private String backgroundType;
    private String backgroundColor;
    private String backgroundImageUrl;
    private Long backgroundTemplateId;
    private Long viewCount;
    private List<PublicProductResponse> products;

    public static PublicCatalogResponse from(Catalog c) {
        PublicCatalogResponse r = new PublicCatalogResponse();
        r.id = c.getId();
        r.publicId = c.getPublicId();
        r.name = c.getName();
        r.description = c.getDescription();
        r.aiContent = c.getAiContent();
        r.coverImageUrl = c.getCoverImageUrl();
        r.viewMode = c.getViewMode();
        r.backgroundType = c.getBackgroundType();
        r.backgroundColor = c.getBackgroundColor();
        r.backgroundImageUrl = c.getBackgroundImageUrl();
        r.backgroundTemplateId = c.getBackgroundTemplateId();
        r.viewCount = c.getViewCount();
        r.products = c.getProducts().stream()
                .filter(p -> p.isActive())
                .filter(p -> {
                    if (Boolean.TRUE.equals(p.isShowStock()) && "IN_STOCK".equals(p.getStockStatus())
                        && p.getStockCount() != null && p.getStockCount() <= 0
                        && !p.isShowWhenOutOfStock()) return false;
                    return true;
                })
                .sorted((a, b) -> {
                    if (a.getSortOrder() == null && b.getSortOrder() == null) return 0;
                    if (a.getSortOrder() == null) return 1;
                    if (b.getSortOrder() == null) return -1;
                    return a.getSortOrder().compareTo(b.getSortOrder());
                })
                .map(PublicProductResponse::from)
                .toList();
        return r;
    }
}
