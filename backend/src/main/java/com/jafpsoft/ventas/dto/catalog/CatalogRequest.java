package com.jafpsoft.ventas.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CatalogRequest {
    @NotBlank
    private String name;
    private String description;
}
