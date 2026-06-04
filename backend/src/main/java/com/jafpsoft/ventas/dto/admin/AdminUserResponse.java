package com.jafpsoft.ventas.dto.admin;

import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String slug;
    private boolean appAdmin;
    private boolean emailVerified;
    private boolean enabled;
    private int catalogCount;
    private LocalDateTime createdAt;

    public static AdminUserResponse from(User u, int catalogCount) {
        AdminUserResponse r = new AdminUserResponse();
        r.id = u.getId();
        r.name = u.getName();
        r.email = u.getEmail();
        r.slug = u.getSlug();
        r.appAdmin = u.isAppAdmin();
        r.emailVerified = u.isEmailVerified();
        r.enabled = u.isEnabled();
        r.catalogCount = catalogCount;
        r.createdAt = u.getCreatedAt();
        return r;
    }
}
