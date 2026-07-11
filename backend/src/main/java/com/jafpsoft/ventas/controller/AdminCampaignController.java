package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.model.MassEmailCampaign;
import com.jafpsoft.ventas.repository.MassEmailCampaignRepository;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.BatchNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/campaigns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCampaignController {

    private final BatchNotificationService batchNotificationService;
    private final MassEmailCampaignRepository campaignRepository;

    @PostMapping("/mp-announcement")
    public ResponseEntity<Map<String, Object>> launchMpAnnouncement(
            @AuthenticationPrincipal CustomUserDetails user) {
        MassEmailCampaign campaign = batchNotificationService.launchMpAnnouncementCampaign(user.getUserId());
        return ResponseEntity.accepted().body(Map.of(
            "campaignId", campaign.getId(),
            "totalUsers", campaign.getTotalCount(),
            "status", campaign.getStatus(),
            "message", "Campaña iniciada. Bloques de " + 100 + " emails cada 5 minutos."
        ));
    }

    @GetMapping("/mp-announcement/status")
    public ResponseEntity<Map<String, Object>> getMpAnnouncementStatus() {
        Optional<MassEmailCampaign> latest = campaignRepository
            .findTopByTypeOrderByCreatedAtDesc("MP_ANNOUNCEMENT");
        if (latest.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "NEVER_RUN"));
        }
        MassEmailCampaign c = latest.get();
        return ResponseEntity.ok(Map.of(
            "campaignId", c.getId(),
            "status", c.getStatus(),
            "totalCount", c.getTotalCount() != null ? c.getTotalCount() : 0,
            "sentCount", c.getSentCount(),
            "failedCount", c.getFailedCount(),
            "startedAt", c.getStartedAt() != null ? c.getStartedAt().toString() : "",
            "completedAt", c.getCompletedAt() != null ? c.getCompletedAt().toString() : ""
        ));
    }
}
