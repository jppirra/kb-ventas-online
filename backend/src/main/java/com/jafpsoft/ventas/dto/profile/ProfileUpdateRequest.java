package com.jafpsoft.ventas.dto.profile;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ProfileUpdateRequest {

    @Size(max = 100)
    private String name;

    @Pattern(regexp = "^[a-z0-9-]{3,40}$", message = "El slug solo puede contener letras minúsculas, números y guiones (3-40 caracteres)")
    private String slug;

    @Size(max = 500)
    private String bio;

    private String brandColorPrimary;
    private String brandColorSecondary;
    private String whatsappNumber;
    private String countryCode;
    private List<SocialLinkDto> socialLinks;
}
