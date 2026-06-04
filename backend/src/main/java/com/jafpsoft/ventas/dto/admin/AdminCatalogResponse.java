package com.jafpsoft.ventas.dto.admin;

import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogStatus;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminCatalogResponse {
    private Long id;
    private String name;
    private CatalogStatus status;
    private boolean active;
    private Long viewCount;
    private int productCount;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private LocalDateTime createdAt;

    public static AdminCatalogResponse from(Catalog c, User owner) {
        AdminCatalogResponse r = new AdminCatalogResponse();
        r.id = c.getId();
        r.name = c.getName();
        r.status = c.getStatus();
        r.active = c.isActive();
        r.viewCount = c.getViewCount();
        r.productCount = c.getProducts().size();
        r.createdAt = c.getCreatedAt();
        if (owner != null) {
            r.ownerId = owner.getId();
            r.ownerName = owner.getName();
            r.ownerEmail = owner.getEmail();
        }
        return r;
    }
}
