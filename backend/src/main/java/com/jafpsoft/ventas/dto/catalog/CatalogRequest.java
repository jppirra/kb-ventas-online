package com.jafpsoft.ventas.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CatalogRequest {
    @NotBlank
    private String name;
    private String description;
    private String viewMode;
    private String backgroundType;
    private String backgroundColor;
    private String backgroundImageUrl;
    private Long backgroundTemplateId;
    private String rubro;
    private Boolean sizesEnabled;
    private String sizeOptions;
    private Boolean colorsEnabled;
    private String colorOptions;
}
