package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.SocialLink;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.time.LocalDateTime;
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
    private LocalDateTime publishedAt;

    private static PublicCatalogPageResponse vendorInfo(Catalog c, User owner, List<SocialLink> socialLinks) {
        PublicCatalogPageResponse r = new PublicCatalogPageResponse();
        r.available = true;
        r.vendorName = owner.getName();
        r.vendorSlug = owner.getSlug();
        r.vendorWhatsapp = owner.getWhatsappNumber();
        r.vendorProfileImageUrl = owner.getProfileImageUrl();
        r.vendorBannerImageUrl = owner.getBannerImageUrl();
        r.vendorBio = owner.getBio();
        r.vendorBrandColorPrimary = owner.getBrandColorPrimary();
        r.vendorBrandColorSecondary = owner.getBrandColorSecondary();
        r.vendorSocialLinks = socialLinks.stream().map(SocialLinkDto::from).toList();
        r.publishedAt = c.getPublishedAt();
        return r;
    }

    public static PublicCatalogPageResponse fromSnapshot(Catalog c, User owner, List<SocialLink> socialLinks, CatalogSnapshotData snapshot) {
        PublicCatalogPageResponse r = vendorInfo(c, owner, socialLinks);
        r.catalog = PublicCatalogResponse.fromSnapshot(c, snapshot);
        return r;
    }

    public static PublicCatalogPageResponse from(Catalog c, User owner, List<SocialLink> socialLinks) {
        PublicCatalogPageResponse r = vendorInfo(c, owner, socialLinks);
        r.catalog = PublicCatalogResponse.from(c);
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
