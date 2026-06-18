package com.jafpsoft.ventas.dto.profile;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ExplorarResponse {
    private List<CatalogSearchResultResponse> featured;
    private List<CatalogSearchResultResponse> results;
}
