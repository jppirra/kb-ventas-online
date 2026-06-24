package com.jafpsoft.ventas.scheduler;

import com.jafpsoft.ventas.repository.TicketConfigRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import com.jafpsoft.ventas.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class CertificateExpirationScheduler {

    private final TicketConfigRepository configRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;

    /** Corre todos los días a las 08:00 hora Argentina */
    @Scheduled(cron = "0 0 8 * * *", zone = "America/Argentina/Buenos_Aires")
    @Transactional
    public void checkExpiringCertificates() {
        LocalDate threshold = LocalDate.now().plusDays(30);

        configRepo.findAll().stream()
                .filter(c -> c.isAfipEnabled()
                        && c.getAfipCertExpiry() != null
                        && !c.isAfipCertNotifiedExpiry()
                        && c.getAfipCertExpiry().isBefore(threshold))
                .forEach(c -> {
                    try {
                        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), c.getAfipCertExpiry());
                        Long uid = java.util.Objects.requireNonNull(c.getUserId());
                        userRepo.findById(uid).ifPresent(user -> {
                            emailService.sendAfipCertExpirationWarning(
                                    user.getEmail(), user.getName(), c.getAfipCertExpiry(), daysLeft);
                        });
                        c.setAfipCertNotifiedExpiry(true);
                        configRepo.save(c);
                        log.info("Notificación vencimiento cert AFIP userId={} expiry={} daysLeft={}",
                                c.getUserId(), c.getAfipCertExpiry(), daysLeft);
                    } catch (Exception e) {
                        log.error("Error notificando vencimiento cert userId={}: {}",
                                c.getUserId(), e.getMessage());
                    }
                });
    }
}
