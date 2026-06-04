package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.SocialLink;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.util.List;

@Data
public class PublicProfileResponse {
    private String name;
    private String slug;
    private String bio;
    private String profileImageUrl;
    private String bannerImageUrl;
    private String brandColorPrimary;
    private String brandColorSecondary;
    private String whatsappNumber;
    private List<SocialLinkDto> socialLinks;
    private List<PublicCatalogResponse> catalogs;

    public static PublicProfileResponse from(User u, List<SocialLink> links) {
        PublicProfileResponse r = new PublicProfileResponse();
        r.name = u.getName();
        r.slug = u.getSlug();
        r.bio = u.getBio();
        r.profileImageUrl = u.getProfileImageUrl();
        r.bannerImageUrl = u.getBannerImageUrl();
        r.brandColorPrimary = u.getBrandColorPrimary();
        r.brandColorSecondary = u.getBrandColorSecondary();
        r.whatsappNumber = u.getWhatsappNumber();
        r.socialLinks = links.stream().map(SocialLinkDto::from).toList();
        return r;
    }
}
