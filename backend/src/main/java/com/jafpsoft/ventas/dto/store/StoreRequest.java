package com.jafpsoft.ventas.dto.store;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class StoreRequest {
    @NotBlank
    private String name;

    @Pattern(regexp = "^[a-z0-9-]{3,40}$", message = "El slug solo puede contener letras minúsculas, números y guiones (3-40 caracteres)")
    private String slug;

    private String description;
    private String logoUrl;
    private String whatsappNumber;
    private Boolean active;
}
