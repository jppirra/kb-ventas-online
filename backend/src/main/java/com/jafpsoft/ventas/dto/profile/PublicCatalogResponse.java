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
    private String rubro;
    private Integer discount;
    private String sectionOrder;
    private Long viewCount;
    private List<PublicProductResponse> products;

    public static PublicCatalogResponse fromSnapshot(Catalog c, CatalogSnapshotData snap) {
        PublicCatalogResponse r = new PublicCatalogResponse();
        r.id = c.getId();
        r.publicId = c.getPublicId();
        r.name = snap.getName();
        r.description = snap.getDescription();
        r.aiContent = snap.getAiContent();
        r.coverImageUrl = snap.getCoverImageUrl();
        r.viewMode = snap.getViewMode();
        r.backgroundType = snap.getBackgroundType();
        r.backgroundColor = snap.getBackgroundColor();
        r.backgroundImageUrl = snap.getBackgroundImageUrl();
        r.rubro = snap.getRubro();
        r.discount = c.getDiscount();
        r.sectionOrder = snap.getSectionOrder();
        r.viewCount = c.getViewCount();
        r.products = snap.getProducts();
        return r;
    }

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
        r.rubro = c.getRubro();
        r.discount = c.getDiscount();
        r.sectionOrder = c.getSectionOrder();
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
