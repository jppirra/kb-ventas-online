package com.jafpsoft.ventas.dto.customer;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CustomerResponse {
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private long totalOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastPurchaseAt;
}
