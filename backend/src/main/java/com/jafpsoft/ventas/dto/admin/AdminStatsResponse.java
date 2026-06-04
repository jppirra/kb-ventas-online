package com.jafpsoft.ventas.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long enabledUsers;
    private long adminUsers;
    private long totalCatalogs;
    private long activeCatalogs;
    private long generatedCatalogs;
    private long totalProducts;
    private long totalCatalogViews;
    private long totalWhatsappClicks;
}
