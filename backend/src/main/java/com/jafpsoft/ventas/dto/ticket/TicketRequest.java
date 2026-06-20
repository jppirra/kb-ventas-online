package com.jafpsoft.ventas.dto.ticket;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class TicketRequest {
    private String customerName;
    private String customerDni;
    private String customerPhone;
    private String customerEmail;
    private String customerNotes;
    private String paymentMethod;
    private BigDecimal discount;
    private String notes;
    private String tipoDoc;
    private String referenceTicketNumber;
    @Valid @NotEmpty
    private List<TicketItemRequest> items;

    // Si true: crea el ticket en DRAFT para pagar luego con MP (sin descontar stock)
    private Boolean draft;
}
