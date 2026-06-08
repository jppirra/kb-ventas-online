package com.jafpsoft.ventas.dto.ticket;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class TicketRequest {
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerNotes;
    private String paymentMethod;
    private BigDecimal discount;
    private String notes;
    @Valid @NotEmpty
    private List<TicketItemRequest> items;
}
