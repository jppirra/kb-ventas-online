package com.jafpsoft.ventas.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank
    private String name;
    private String description;
    private BigDecimal price;
    private String sku;
    private String category;
    private String imageUrl;
    private Integer sortOrder;
}
