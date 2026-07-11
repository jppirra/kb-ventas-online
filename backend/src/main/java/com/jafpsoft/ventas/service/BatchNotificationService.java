package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.model.MassEmailCampaign;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.EmailLogRepository;
import com.jafpsoft.ventas.repository.MassEmailCampaignRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BatchNotificationService {

    private static final int BATCH_SIZE = 100;
    private static final long BATCH_DELAY_MINUTES = 5;

    private final UserRepository userRepository;
    private final EmailLogRepository emailLogRepository;
    private final MassEmailCampaignRepository campaignRepository;
    private final EmailService emailService;
    private final TaskScheduler taskScheduler;

    // ── Lanzar campaña ────────────────────────────────────────────────────────

    @Transactional
    public MassEmailCampaign launchMpAnnouncementCampaign(Long adminUserId) {
        campaignRepository.findTopByTypeAndStatusOrderByCreatedAtDesc("MP_ANNOUNCEMENT", "RUNNING")
            .ifPresent(c -> {
                throw new IllegalStateException("Ya existe una campaña en ejecución (id=" + c.getId() + ")");
            });

        long total = userRepository.count();
        MassEmailCampaign campaign = campaignRepository.save(MassEmailCampaign.builder()
            .type("MP_ANNOUNCEMENT")
            .status("RUNNING")
            .totalCount((int) total)
            .sentCount(0)
            .failedCount(0)
            .nextUserId(0L)
            .startedAt(LocalDateTime.now())
            .triggeredBy(adminUserId)
            .build());

        log.info("MP announcement campaign {} launched by admin {} — {} users total",
            campaign.getId(), adminUserId, total);

        // Primer batch inmediatamente
        taskScheduler.schedule(() -> processBatch(campaign.getId()), Instant.now());

        return campaign;
    }

    // ── Procesar un bloque de hasta BATCH_SIZE usuarios ───────────────────────

    @Transactional
    public void processBatch(Long campaignId) {
        MassEmailCampaign campaign = campaignRepository.findById(campaignId)
            .orElseThrow(() -> new EntityNotFoundException("Campaign " + campaignId + " not found"));

        if (!"RUNNING".equals(campaign.getStatus())) {
            log.info("Campaign {} is {} — skipping batch", campaignId, campaign.getStatus());
            return;
        }

        // Cursor-based pagination: users con ID > nextUserId, ordenados ASC
        List<User> users = userRepository.findEnabledAfterIdOrderById(
            campaign.getNextUserId(), PageRequest.of(0, BATCH_SIZE));

        if (users.isEmpty()) {
            markCompleted(campaign);
            return;
        }

        int batchSent = 0;
        int batchFailed = 0;
        long lastId = campaign.getNextUserId();

        for (User user : users) {
            lastId = user.getId();

            // Idempotencia: no reenviar si ya fue enviado en esta campaña
            if (emailLogRepository.existsByToEmailAndType(user.getEmail(), "MP_ANNOUNCEMENT")) {
                log.debug("Skip {} — MP_ANNOUNCEMENT ya enviado", user.getEmail());
                batchSent++;
                continue;
            }

            try {
                String name = user.getName() != null && !user.getName().isBlank()
                    ? user.getName() : user.getEmail();
                emailService.sendMpAnnouncementEmailSync(user.getEmail(), name);
                batchSent++;
            } catch (Exception e) {
                log.error("Failed MP announcement to userId={} email={}: {}",
                    user.getId(), user.getEmail(), e.getMessage());
                batchFailed++;
            }
        }

        campaign.setSentCount(campaign.getSentCount() + batchSent);
        campaign.setFailedCount(campaign.getFailedCount() + batchFailed);
        campaign.setNextUserId(lastId);
        campaignRepository.save(campaign);

        int processed = campaign.getSentCount() + campaign.getFailedCount();
        log.info("Campaign {} batch done — batch sent={} failed={} | total {}/{} | nextUserId={}",
            campaignId, batchSent, batchFailed, processed, campaign.getTotalCount(), lastId);

        boolean hasMore = users.size() == BATCH_SIZE;
        if (hasMore) {
            // Pausa de 5 minutos antes del próximo bloque para proteger reputación del dominio
            Instant nextRun = Instant.now().plus(BATCH_DELAY_MINUTES, ChronoUnit.MINUTES);
            taskScheduler.schedule(() -> processBatch(campaignId), nextRun);
            log.info("Campaign {} next batch scheduled in {} min", campaignId, BATCH_DELAY_MINUTES);
        } else {
            markCompleted(campaign);
        }
    }

    private void markCompleted(MassEmailCampaign campaign) {
        campaign.setStatus("COMPLETED");
        campaign.setCompletedAt(LocalDateTime.now());
        campaignRepository.save(campaign);
        log.info("Campaign {} COMPLETED — sent={} failed={}",
            campaign.getId(), campaign.getSentCount(), campaign.getFailedCount());
    }
}
