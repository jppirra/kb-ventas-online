package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.SocialLink;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.util.List;

@Data
public class ProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String slug;
    private String bio;
    private String profileImageUrl;
    private String bannerImageUrl;
    private String brandColorPrimary;
    private String brandColorSecondary;
    private String whatsappNumber;
    private String countryCode;
    private List<SocialLinkDto> socialLinks;

    public static ProfileResponse from(User u, List<SocialLink> links) {
        ProfileResponse r = new ProfileResponse();
        r.id = u.getId();
        r.name = u.getName();
        r.email = u.getEmail();
        r.slug = u.getSlug();
        r.bio = u.getBio();
        r.profileImageUrl = u.getProfileImageUrl();
        r.bannerImageUrl = u.getBannerImageUrl();
        r.brandColorPrimary = u.getBrandColorPrimary();
        r.brandColorSecondary = u.getBrandColorSecondary();
        r.whatsappNumber = u.getWhatsappNumber();
        r.countryCode = u.getCountryCode() != null ? u.getCountryCode() : "AR";
        r.socialLinks = links.stream().map(SocialLinkDto::from).toList();
        return r;
    }
}
