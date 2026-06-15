package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.analytics.AnalyticsSummaryDto;
import com.jafpsoft.ventas.dto.analytics.TrackEventRequest;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/app")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PostMapping("/events")
    public ResponseEntity<Void> track(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody TrackEventRequest req) {
        Long userId = principal != null ? principal.getUserId() : null;
        analyticsService.trackEvent(userId, req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public AnalyticsSummaryDto summary() {
        return analyticsService.getSummary();
    }

    @DeleteMapping("/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reset() {
        analyticsService.resetAnalytics();
        return ResponseEntity.ok().build();
    }
}
