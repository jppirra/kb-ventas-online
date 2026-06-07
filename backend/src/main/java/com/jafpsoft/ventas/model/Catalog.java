package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "catalogs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Catalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String aiContent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CatalogStatus status = CatalogStatus.DRAFT;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "view_mode", length = 20)
    @Builder.Default
    private String viewMode = "GRID";

    @Column(name = "background_type", length = 20)
    @Builder.Default
    private String backgroundType = "NONE";

    @Column(name = "background_color", length = 20)
    private String backgroundColor;

    @Column(name = "background_image_url")
    private String backgroundImageUrl;

    @Column(name = "background_template_id")
    private Long backgroundTemplateId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @OneToMany(mappedBy = "catalog", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
