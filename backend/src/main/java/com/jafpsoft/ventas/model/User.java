package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "is_app_admin", nullable = false)
    @Builder.Default
    private boolean appAdmin = false;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    // ── Perfil público ──────────────────────────────────────────────────────
    @Column(unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "banner_image_url")
    private String bannerImageUrl;

    @Column(name = "brand_color_primary", length = 7)
    @Builder.Default
    private String brandColorPrimary = "#2563eb";

    @Column(name = "brand_color_secondary", length = 7)
    @Builder.Default
    private String brandColorSecondary = "#7c3aed";

    @Column(name = "whatsapp_number")
    private String whatsappNumber;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

