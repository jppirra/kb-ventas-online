package com.jafpsoft.ventas.dto.profile;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class CatalogSnapshotData {
    private String rubro;
    private Integer discount;
    private String name;
    private String description;
    private String aiContent;
    private String coverImageUrl;
    private String viewMode;
    private String backgroundType;
    private String backgroundColor;
    private String backgroundImageUrl;
    private List<PublicProductResponse> products;
}
