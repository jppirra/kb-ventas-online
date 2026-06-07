package com.jafpsoft.ventas.dto.store;

import com.jafpsoft.ventas.model.Store;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StoreResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private String whatsappNumber;
    private boolean active;
    private LocalDateTime createdAt;

    public static StoreResponse from(Store s) {
        StoreResponse r = new StoreResponse();
        r.id = s.getId();
        r.name = s.getName();
        r.slug = s.getSlug();
        r.description = s.getDescription();
        r.logoUrl = s.getLogoUrl();
        r.whatsappNumber = s.getWhatsappNumber();
        r.active = s.isActive();
        r.createdAt = s.getCreatedAt();
        return r;
    }
}
