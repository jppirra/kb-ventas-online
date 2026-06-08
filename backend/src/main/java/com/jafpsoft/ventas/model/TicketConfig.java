package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketConfig {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "business_address")
    private String businessAddress;

    @Column(name = "business_phone")
    private String businessPhone;

    @Column(name = "business_email")
    private String businessEmail;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(length = 10)
    @Builder.Default
    private String currency = "$";

    @Column(name = "payment_methods")
    private String paymentMethods;

    @Column(columnDefinition = "TEXT")
    private String footer;

    @Column(name = "show_catalog_qr", nullable = false)
    @Builder.Default
    private boolean showCatalogQr = false;

    @Column(name = "next_ticket_number", nullable = false)
    @Builder.Default
    private Integer nextTicketNumber = 1;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
