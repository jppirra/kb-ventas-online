package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mp_webhook_events",
        uniqueConstraints = @UniqueConstraint(name = "uk_mp_webhook_external_id", columnNames = "external_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MercadoPagoWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "payment:123456789" — garantía de idempotencia via UNIQUE constraint
    @Column(name = "external_id", nullable = false, length = 100)
    private String externalId;

    @Column(length = 50)
    private String topic;

    @Column(name = "vendor_user_id")
    private Long vendorUserId;

    // received | processing | processed | failed | ignored
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "received";

    @Column(name = "raw_body", columnDefinition = "TEXT")
    private String rawBody;

    @Column(name = "correlation_id", length = 36)
    private String correlationId;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
