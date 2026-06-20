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
    private String customerPhone;
    private String customerEmail;
    private String customerNotes;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal total;
    private String paymentMethod;
    private String status;
    private String notes;
    private String tipoDoc;
    private String referenceTicketNumber;
    private List<TicketItemResponse> items;
    private LocalDateTime createdAt;

    public static TicketResponse from(SaleTicket t) {
        TicketResponse r = new TicketResponse();
        r.id = t.getId();
        r.ticketNumber = t.getTicketNumber();
        r.customerName = t.getCustomerName();
        r.customerPhone = t.getCustomerPhone();
        r.customerEmail = t.getCustomerEmail();
        r.customerNotes = t.getCustomerNotes();
        r.subtotal = t.getSubtotal();
        r.discount = t.getDiscount();
        r.total = t.getTotal();
        r.paymentMethod = t.getPaymentMethod();
        r.status = t.getStatus();
        r.notes = t.getNotes();
        r.tipoDoc = t.getTipoDoc() != null ? t.getTipoDoc() : "COMP";
        r.referenceTicketNumber = t.getReferenceTicketNumber();
        r.createdAt = t.getCreatedAt();
        r.items = t.getItems().stream()
                .sorted((a, b) -> Integer.compare(
                        a.getSortOrder() != null ? a.getSortOrder() : 0,
                        b.getSortOrder() != null ? b.getSortOrder() : 0))
                .map(TicketItemResponse::from)
                .toList();
        return r;
    }
}
