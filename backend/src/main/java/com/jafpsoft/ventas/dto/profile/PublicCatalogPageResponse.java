package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

@Data
public class PublicCatalogPageResponse {
    private PublicCatalogResponse catalog;
    private String vendorName;
    private String vendorSlug;
    private String vendorWhatsapp;
    private String vendorProfileImageUrl;
    private String vendorBannerImageUrl;
    private String vendorBio;
    private String vendorBrandColorPrimary;
    private String vendorBrandColorSecondary;

    public static PublicCatalogPageResponse from(Catalog c, User owner) {
        PublicCatalogPageResponse r = new PublicCatalogPageResponse();
        r.catalog = PublicCatalogResponse.from(c);
        r.vendorName = owner.getName();
        r.vendorSlug = owner.getSlug();
        r.vendorWhatsapp = owner.getWhatsappNumber();
        r.vendorProfileImageUrl = owner.getProfileImageUrl();
        r.vendorBannerImageUrl = owner.getBannerImageUrl();
        r.vendorBio = owner.getBio();
        r.vendorBrandColorPrimary = owner.getBrandColorPrimary();
        r.vendorBrandColorSecondary = owner.getBrandColorSecondary();
        return r;
    }
}
