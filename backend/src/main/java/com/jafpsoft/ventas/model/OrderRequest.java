package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "catalog_id")
    private Long catalogId;

    @Column(name = "catalog_name")
    private String catalogName;

    @Column(name = "vendor_user_id")
    private Long vendorUserId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @Column(name = "vendor_notes", columnDefinition = "TEXT")
    private String vendorNotes;

    @Column(name = "items_json", columnDefinition = "TEXT")
    private String itemsJson;

    private BigDecimal total;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
