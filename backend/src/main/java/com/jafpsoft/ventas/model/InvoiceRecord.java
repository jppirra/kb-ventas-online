package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_records", indexes = {
    @Index(name = "idx_invoice_user",        columnList = "user_id"),
    @Index(name = "idx_invoice_correlation",  columnList = "correlation_id", unique = true),
    @Index(name = "idx_invoice_ticket",       columnList = "sale_ticket_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "sale_ticket_id")
    private Long saleTicketId;

    /** UUID generado en la app antes de llamar a AFIP — garantiza idempotencia ante fallos de red */
    @Column(name = "correlation_id", length = 36, nullable = false, unique = true)
    private String correlationId;

    @Column(name = "tipo_cbte", nullable = false)
    private Integer tipoCbte;      // 1=FA, 6=FB, 11=FC

    @Column(name = "punto_venta", nullable = false)
    private Integer puntoVenta;

    @Column(name = "nro_cbte")
    private Long nroCbte;

    @Column(name = "cuit_emisor", length = 11)
    private String cuitEmisor;

    @Column(name = "doc_tipo")
    private Integer docTipo;       // 80=CUIT, 96=DNI, 99=CF

    @Column(name = "doc_nro")
    private Long docNro;

    @Column(name = "concepto")
    private Integer concepto;      // 1=Productos, 2=Servicios, 3=Ambos

    @Column(name = "cbte_fecha", length = 8)
    private String cbteFecha;      // YYYYMMDD

    @Column(name = "imp_total", precision = 15, scale = 2)
    private BigDecimal impTotal;

    @Column(name = "imp_neto", precision = 15, scale = 2)
    private BigDecimal impNeto;

    @Column(name = "imp_iva", precision = 15, scale = 2)
    private BigDecimal impIva;

    @Column(name = "aliciva_id")
    private Integer alicIvaId;     // 3=0%, 4=10.5%, 5=21%, 6=27%

    @Column(name = "moneda", length = 3)
    @Builder.Default
    private String moneda = "PES";

    @Column(name = "cae", length = 14)
    private String cae;

    @Column(name = "cae_expiry")
    private LocalDate caeExpiry;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private InvoiceStatus status;

    @Column(name = "afip_result_code")
    private Integer afipResultCode;

    @Column(name = "afip_result_msg", length = 1000)
    private String afipResultMsg;

    @Column(name = "qr_data", columnDefinition = "TEXT")
    private String qrData;         // JSON base64 para QR AFIP

    @Column(name = "xml_request", columnDefinition = "TEXT")
    private String xmlRequest;     // auditoria fiscal

    @Column(name = "xml_response", columnDefinition = "TEXT")
    private String xmlResponse;    // auditoria fiscal

    @Column(name = "ambiente", length = 15)
    private String ambiente;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    public enum InvoiceStatus { AUTHORIZED, REJECTED, ERROR, PENDING }
}
