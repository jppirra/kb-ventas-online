package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.SocialLink;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.util.List;

@Data
public class PublicCatalogPageResponse {
    private boolean available = true;
    private PublicCatalogResponse catalog;
    private String vendorName;
    private String vendorSlug;
    private String vendorWhatsapp;
    private String vendorProfileImageUrl;
    private String vendorBannerImageUrl;
    private String vendorBio;
    private String vendorBrandColorPrimary;
    private String vendorBrandColorSecondary;
    private List<SocialLinkDto> vendorSocialLinks;

    public static PublicCatalogPageResponse from(Catalog c, User owner, List<SocialLink> socialLinks) {
        PublicCatalogPageResponse r = new PublicCatalogPageResponse();
        r.available = true;
        r.catalog = PublicCatalogResponse.from(c);
        r.vendorName = owner.getName();
        r.vendorSlug = owner.getSlug();
        r.vendorWhatsapp = owner.getWhatsappNumber();
        r.vendorProfileImageUrl = owner.getProfileImageUrl();
        r.vendorBannerImageUrl = owner.getBannerImageUrl();
        r.vendorBio = owner.getBio();
        r.vendorBrandColorPrimary = owner.getBrandColorPrimary();
        r.vendorBrandColorSecondary = owner.getBrandColorSecondary();
        r.vendorSocialLinks = socialLinks.stream().map(SocialLinkDto::from).toList();
        return r;
    }

    public static PublicCatalogPageResponse unavailable(Catalog c, User owner) {
        PublicCatalogPageResponse r = new PublicCatalogPageResponse();
        r.available = false;
        r.vendorName = owner.getName();
        r.vendorSlug = owner.getSlug();
        PublicCatalogResponse cr = new PublicCatalogResponse();
        cr.setName(c.getName());
        r.catalog = cr;
        return r;
    }
}
