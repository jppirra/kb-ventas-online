package com.jafpsoft.ventas.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopProductResponse {
    private String name;
    private Long productId;
    private Long totalSold;
}
