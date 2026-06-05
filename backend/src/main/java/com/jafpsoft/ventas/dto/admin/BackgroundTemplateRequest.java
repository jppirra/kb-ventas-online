package com.jafpsoft.ventas.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BackgroundTemplateRequest {
    @NotBlank
    private String name;
    private String imageUrl;
    private String description;
    private Integer sortOrder;
    private Boolean active;
}
