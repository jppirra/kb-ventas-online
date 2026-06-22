package com.jafpsoft.ventas.model;

import com.jafpsoft.ventas.security.crypto.EncryptedStringConverter;
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

    @Column(name = "next_nc_number")
    @Builder.Default
    private Integer nextNcNumber = 1;

    @Column(name = "next_nd_number")
    @Builder.Default
    private Integer nextNdNumber = 1;

    // ── Facturación electrónica Argentina (AFIP) ─────────────────────────────
    @Column(name = "tipo_comprobante", length = 2)
    @Builder.Default
    private String tipoComprobante = "B";

    @Column(name = "punto_venta")
    private Integer puntoVenta;

    @Column(name = "condicion_iva", length = 60)
    private String condicionIva;

    @Column(name = "ingresos_brutos", length = 30)
    private String ingresosBrutos;

    @Column(name = "inicio_actividades", length = 20)
    private String inicioActividades;

    // ── Mercado Pago OAuth credentials (sensibles: cifrado AES-256-GCM) ─────────
    @Column(name = "mp_user_id")
    private Long mpUserId;

    // public key va al frontend: no requiere cifrado
    @Column(name = "mp_public_key", length = 100)
    private String mpPublicKey;

    @Column(name = "mp_enabled", columnDefinition = "boolean not null default false")
    @Builder.Default
    private boolean mpEnabled = false;

    @Column(name = "mp_scope", length = 200)
    private String mpScope;

    @Column(name = "mp_connected_at")
    private LocalDateTime mpConnectedAt;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "mp_access_token", columnDefinition = "TEXT")
    private String mpAccessToken;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "mp_refresh_token", columnDefinition = "TEXT")
    private String mpRefreshToken;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "mp_webhook_secret", columnDefinition = "TEXT")
    private String mpWebhookSecret;

    @Column(name = "mp_webhook_id", length = 50)
    private String mpWebhookId;

    @Column(name = "mp_token_expires_at")
    private LocalDateTime mpTokenExpiresAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
