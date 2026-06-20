package com.jafpsoft.ventas.dto.rubro;

import com.jafpsoft.ventas.model.Rubro;
import lombok.Data;

@Data
public class RubroResponse {
    private Long id;
    private String value;
    private String label;
    private Integer sortOrder;
    private boolean active;

    public static RubroResponse from(Rubro r) {
        RubroResponse res = new RubroResponse();
        res.id = r.getId();
        res.value = r.getValue();
        res.label = r.getLabel();
        res.sortOrder = r.getSortOrder();
        res.active = r.isActive();
        return res;
    }
}
