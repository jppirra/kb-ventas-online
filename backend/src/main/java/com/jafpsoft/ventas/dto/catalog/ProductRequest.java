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
    private BigDecimal offerPrice;
    private String sku;
    private String category;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean active;
    private Boolean showStock;
    private String stockStatus;
    private Integer stockCount;
    private Boolean showStockQuantity;
    private Boolean showWhenOutOfStock;
    private String extraImagesJson;
    private String videoUrl;
    private String variantsJson;
    private String sizeStock;
}
