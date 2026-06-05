package com.jafpsoft.ventas.dto.admin;

import com.jafpsoft.ventas.model.BackgroundTemplate;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BackgroundTemplateResponse {
    private Long id;
    private String name;
    private String imageUrl;
    private String description;
    private Integer sortOrder;
    private boolean active;
    private LocalDateTime createdAt;

    public static BackgroundTemplateResponse from(BackgroundTemplate t) {
        BackgroundTemplateResponse r = new BackgroundTemplateResponse();
        r.id = t.getId();
        r.name = t.getName();
        r.imageUrl = t.getImageUrl();
        r.description = t.getDescription();
        r.sortOrder = t.getSortOrder();
        r.active = t.isActive();
        r.createdAt = t.getCreatedAt();
        return r;
    }
}
