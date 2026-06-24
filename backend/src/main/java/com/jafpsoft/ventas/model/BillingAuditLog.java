package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "billing_audit_logs", indexes = {
    @Index(name = "idx_audit_user",        columnList = "user_id"),
    @Index(name = "idx_audit_correlation", columnList = "correlation_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillingAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "correlation_id", length = 36)
    private String correlationId;

    @Column(name = "operation", length = 50)
    private String operation;       // WSAA_AUTH | WSFE_ISSUE | TEST_CONNECTION | CERT_UPLOAD

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private LogStatus status;       // SUCCESS | FAILURE | CIRCUIT_OPEN

    @Column(name = "ambiente", length = 15)
    private String ambiente;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;          // info adicional (código AFIP, etc.)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum LogStatus { SUCCESS, FAILURE, CIRCUIT_OPEN }
}
