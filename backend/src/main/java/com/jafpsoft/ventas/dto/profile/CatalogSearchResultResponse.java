package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

@Data
public class CatalogSearchResultResponse {
    private Long id;
    private String publicId;
    private String name;
    private String description;
    private String coverImageUrl;
    private String rubro;
    private Long viewCount;
    private String vendorName;
    private String vendorSlug;
    private String vendorProfileImageUrl;

    public static CatalogSearchResultResponse from(Catalog c, User owner) {
        CatalogSearchResultResponse r = new CatalogSearchResultResponse();
        r.id = c.getId();
        r.publicId = c.getPublicId();
        r.name = c.getName();
        r.description = c.getDescription();
        r.coverImageUrl = c.getCoverImageUrl();
        r.rubro = c.getRubro();
        r.viewCount = c.getViewCount();
        r.vendorName = owner.getName();
        r.vendorSlug = owner.getSlug();
        r.vendorProfileImageUrl = owner.getProfileImageUrl();
        return r;
    }
}
