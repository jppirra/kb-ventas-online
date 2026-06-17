package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalog_id", nullable = true)
    private Catalog catalog;

    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String aiDescription;

    private BigDecimal price;

    @Column(name = "offer_price")
    private BigDecimal offerPrice;

    private String sku;

    private String category;

    private String imageUrl;

    private Integer sortOrder;

    private Integer stockCount;

    @Column(name = "stock_status", length = 20)
    private String stockStatus;

    @Column(name = "show_stock", nullable = false)
    @Builder.Default
    private boolean showStock = false;

    @Column(name = "show_stock_quantity", nullable = false)
    @Builder.Default
    private boolean showStockQuantity = false;

    @Column(name = "size_stock", columnDefinition = "TEXT")
    private String sizeStock;

    @Column(name = "show_when_out_of_stock", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean showWhenOutOfStock = false;

    @Column(name = "whatsapp_clicks", nullable = false)
    @Builder.Default
    private Long whatsappClicks = 0L;

    @Column(name = "extra_images_json", columnDefinition = "TEXT")
    private String extraImagesJson;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "variants_json", columnDefinition = "TEXT")
    private String variantsJson;

    @Column(name = "product_sizes", columnDefinition = "TEXT")
    private String productSizes;

    @Column(name = "product_colors", columnDefinition = "TEXT")
    private String productColors;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
