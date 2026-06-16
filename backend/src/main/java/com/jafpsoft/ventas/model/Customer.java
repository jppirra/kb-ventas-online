package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "customers",
        indexes = { @Index(name = "idx_customer_vendor", columnList = "vendor_user_id") },
        uniqueConstraints = { @UniqueConstraint(name = "uq_customer_vendor_order", columnNames = {"vendor_user_id", "order_id"}) }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendor_user_id", nullable = false)
    private Long vendorUserId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 30)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 30)
    @Builder.Default
    private String source = "manual";

    @Column(name = "order_id")
    private Long orderId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
