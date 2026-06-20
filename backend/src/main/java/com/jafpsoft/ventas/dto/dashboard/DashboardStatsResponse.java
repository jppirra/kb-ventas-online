package com.jafpsoft.ventas.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalCatalogs;
    private long totalProducts;
    private long totalOrders;
    private long pendingOrders;
    private long totalViews;
    // Estadísticas de tickets (filtradas por mes)
    private long totalTickets;
    private BigDecimal totalRevenue;
    private long totalCustomers;
    private String month;
}
