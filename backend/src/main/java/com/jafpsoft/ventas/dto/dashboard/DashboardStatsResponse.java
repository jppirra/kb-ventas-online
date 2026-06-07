package com.jafpsoft.ventas.dto.dashboard;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalCatalogs;
    private long totalProducts;
    private long totalOrders;
    private long pendingOrders;
    private long totalViews;
}
