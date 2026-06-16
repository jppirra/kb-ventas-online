package com.jafpsoft.ventas.dto.analytics;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsSummaryDto {
    private long totalEvents30d;
    private long anonymousVisits30d;
    private long activeUsers7d;
    private long activeUsers30d;
    private List<Map<String, Object>> topPages;
    private Map<String, Long> deviceBreakdown;
    private Map<String, Long> browserBreakdown;
    private Map<String, Long> osBreakdown;
    private Map<String, Long> eventTypeBreakdown;
    private List<Map<String, Object>> dailyActiveUsers;
}
