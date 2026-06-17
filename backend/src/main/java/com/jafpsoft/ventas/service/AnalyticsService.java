package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.analytics.AnalyticsSummaryDto;
import com.jafpsoft.ventas.dto.analytics.TrackEventRequest;
import com.jafpsoft.ventas.model.UserEvent;
import com.jafpsoft.ventas.repository.UserEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserEventRepository userEventRepository;

    @Async
    public void trackEvent(Long userId, TrackEventRequest req) {
        UserEvent event = UserEvent.builder()
                .userId(userId)
                .eventType(req.getEventType())
                .page(req.getPage())
                .sessionId(req.getSessionId())
                .durationMs(req.getDurationMs())
                .browser(req.getBrowser())
                .browserVersion(req.getBrowserVersion())
                .os(req.getOs())
                .deviceType(req.getDeviceType())
                .metadata(req.getMetadata())
                .build();
        userEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryDto getSummary() {
        Instant now = Instant.now();
        Instant since30d = now.minus(30, ChronoUnit.DAYS);
        Instant since7d  = now.minus(7,  ChronoUnit.DAYS);

        long totalEvents30d    = userEventRepository.countTotalEventsSince(since30d);
        long anonymousVisits30d = userEventRepository.countAnonymousEventsSince(since30d);
        long activeUsers7d     = userEventRepository.countDistinctUsersSince(since7d);
        long activeUsers30d    = userEventRepository.countDistinctUsersSince(since30d);

        List<Map<String, Object>> topPages        = userEventRepository.findTopPagesSince(since30d);
        List<Map<String, Object>> dailyActiveUsers = userEventRepository.findDailyActiveUsersSince(since30d);

        Map<String, Long> deviceBreakdown    = toBreakdownMap(userEventRepository.countByDeviceTypeSince(since30d));
        Map<String, Long> browserBreakdown   = toBreakdownMap(userEventRepository.countByBrowserSince(since30d));
        Map<String, Long> osBreakdown        = toBreakdownMap(userEventRepository.countByOsSince(since30d));
        Map<String, Long> eventTypeBreakdown = toBreakdownMap(userEventRepository.countByEventTypeSince(since30d));

        return AnalyticsSummaryDto.builder()
                .totalEvents30d(totalEvents30d)
                .anonymousVisits30d(anonymousVisits30d)
                .activeUsers7d(activeUsers7d)
                .activeUsers30d(activeUsers30d)
                .topPages(topPages)
                .dailyActiveUsers(dailyActiveUsers)
                .deviceBreakdown(deviceBreakdown)
                .browserBreakdown(browserBreakdown)
                .osBreakdown(osBreakdown)
                .eventTypeBreakdown(eventTypeBreakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActiveUsers(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return userEventRepository.findActiveUsersSince(since);
    }

    @Transactional
    public void resetAnalytics() {
        userEventRepository.deleteAllEvents();
    }

    private Map<String, Long> toBreakdownMap(List<Map<String, Object>> rows) {
        return rows.stream().collect(Collectors.toMap(
                r -> String.valueOf(r.get("key")),
                r -> ((Number) r.get("count")).longValue()
        ));
    }
}
