package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogReport;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.CatalogReportRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int PAUSE_THRESHOLD = 10;

    private final CatalogReportRepository reportRepository;
    private final CatalogRepository catalogRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void report(String publicId, String reason, String details) {
        Catalog catalog = catalogRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catálogo no encontrado"));

        if (!catalog.isActive()) {
            throw new ResponseStatusException(HttpStatus.GONE, "El catálogo ya no está disponible");
        }

        CatalogReport report = CatalogReport.builder()
                .catalogId(catalog.getId())
                .reason(reason)
                .details(details)
                .build();
        reportRepository.save(report);

        long total = reportRepository.countByCatalogId(catalog.getId());

        if (total >= PAUSE_THRESHOLD) {
            catalog.setActive(false);
            catalogRepository.save(catalog);

            User owner = userRepository.findById(catalog.getUserId()).orElse(null);
            if (owner != null) {
                emailService.sendCatalogPausedEmail(owner.getEmail(), owner.getName(), catalog.getName(), total);
            }
        }
    }
}
