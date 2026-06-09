package com.jafpsoft.ventas.dto.ticket;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TicketItemRequest {
    private Long productId;
    @NotBlank
    private String productName;
    private String productSku;
    private String size;
    private String color;
    @Min(1)
    private Integer quantity = 1;
    private BigDecimal unitPrice;
    private Integer sortOrder;
}
