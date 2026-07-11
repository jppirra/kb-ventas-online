package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mp_payment_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MercadoPagoPaymentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ON DELETE SET NULL — logs persisten aunque se elimine el ticket
    @Column(name = "sale_ticket_id")
    private Long saleTicketId;

    @Column(name = "vendor_user_id")
    private Long vendorUserId;

    @Column(name = "mp_payment_id", length = 50)
    private String mpPaymentId;

    @Column(name = "event_type", length = 50)
    private String eventType;

    @Column(name = "old_status", length = 30)
    private String oldStatus;

    @Column(name = "new_status", length = 30)
    private String newStatus;

    // JSON con datos adicionales de MP (sin datos sensibles)
    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "correlation_id", length = 36)
    private String correlationId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
