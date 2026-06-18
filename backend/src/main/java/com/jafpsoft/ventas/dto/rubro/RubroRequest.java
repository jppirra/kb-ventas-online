package com.jafpsoft.ventas.dto.rubro;

import lombok.Data;

@Data
public class RubroRequest {
    private String value;
    private String label;
    private Integer sortOrder;
    private Boolean active;
}
