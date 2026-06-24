package com.jafpsoft.ventas.dto.ticket;

import com.jafpsoft.ventas.model.SaleTicket;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketResponse {
    private Long id;
    private String ticketNumber;
    private String customerName;
    private String customerDni;
    private String customerPhone;
    private String customerEmail;
    private String customerNotes;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal total;
    private String paymentMethod;
    private String status;
    private String cancellationReason;
    private String notes;
    private String tipoDoc;
    private String referenceTicketNumber;
    private List<TicketItemResponse> items;
    private LocalDateTime createdAt;
    // Pago local
    private String paymentReference;
    private String paymentProofUrl;
    // Mercado Pago
    private String mpStatus;
    private String mpPreferenceId;
    private String mpPaymentId;
    // Link público
    private String publicToken;

    public static TicketResponse from(SaleTicket t) {
        TicketResponse r = new TicketResponse();
        r.id = t.getId();
        r.ticketNumber = t.getTicketNumber();
        r.customerName = t.getCustomerName();
        r.customerDni = t.getCustomerDni();
        r.customerPhone = t.getCustomerPhone();
        r.customerEmail = t.getCustomerEmail();
        r.customerNotes = t.getCustomerNotes();
        r.subtotal = t.getSubtotal();
        r.discount = t.getDiscount();
        r.total = t.getTotal();
        r.paymentMethod = t.getPaymentMethod();
        r.status = t.getStatus();
        r.cancellationReason = t.getCancellationReason();
        r.notes = t.getNotes();
        r.tipoDoc = t.getTipoDoc() != null ? t.getTipoDoc() : "COMP";
        r.referenceTicketNumber = t.getReferenceTicketNumber();
        r.createdAt = t.getCreatedAt();
        r.paymentReference = t.getPaymentReference();
        r.paymentProofUrl = t.getPaymentProofUrl();
        r.mpStatus = t.getMpStatus();
        r.mpPreferenceId = t.getMpPreferenceId();
        r.mpPaymentId = t.getMpPaymentId();
        r.publicToken = t.getPublicToken();
        r.items = t.getItems().stream()
                .sorted((a, b) -> Integer.compare(
                        a.getSortOrder() != null ? a.getSortOrder() : 0,
                        b.getSortOrder() != null ? b.getSortOrder() : 0))
                .map(TicketItemResponse::from)
                .toList();
        return r;
    }
}
