package com.jafpsoft.ventas.dto.billing;

import com.jafpsoft.ventas.model.InvoiceRecord;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class InvoiceRecordResponse {
    private Long id;
    private Long saleTicketId;
    private String correlationId;
    private Integer tipoCbte;
    private Integer puntoVenta;
    private Long nroCbte;
    private String cuitEmisor;
    private String cae;
    private LocalDate caeExpiry;
    private BigDecimal impTotal;
    private String status;
    private String afipResultMsg;
    private String qrUrl;
    private String ambiente;
    private LocalDateTime requestedAt;

    public static InvoiceRecordResponse from(InvoiceRecord r, String qrBaseUrl) {
        InvoiceRecordResponse dto = new InvoiceRecordResponse();
        dto.id            = r.getId();
        dto.saleTicketId  = r.getSaleTicketId();
        dto.correlationId = r.getCorrelationId();
        dto.tipoCbte      = r.getTipoCbte();
        dto.puntoVenta    = r.getPuntoVenta();
        dto.nroCbte       = r.getNroCbte();
        dto.cuitEmisor    = r.getCuitEmisor();
        dto.cae           = r.getCae();
        dto.caeExpiry     = r.getCaeExpiry();
        dto.impTotal      = r.getImpTotal();
        dto.status        = r.getStatus() != null ? r.getStatus().name() : null;
        dto.afipResultMsg = r.getAfipResultMsg();
        dto.ambiente      = r.getAmbiente();
        dto.requestedAt   = r.getRequestedAt();
        // Reconstruir URL del QR a partir del JSON base64 almacenado
        if (r.getQrData() != null) {
            dto.qrUrl = (qrBaseUrl != null ? qrBaseUrl : "https://www.afip.gob.ar/fe/qr/?p=") + r.getQrData();
        }
        return dto;
    }
}
