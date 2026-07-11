package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.MercadoPagoWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface MercadoPagoWebhookEventRepository extends JpaRepository<MercadoPagoWebhookEvent, Long> {

    Optional<MercadoPagoWebhookEvent> findByExternalId(String externalId);

    boolean existsByExternalId(String externalId);

    @Modifying
    @Query("UPDATE MercadoPagoWebhookEvent e SET e.status = :status, e.errorMessage = :error WHERE e.id = :id")
    void updateStatus(@Param("id") Long id, @Param("status") String status, @Param("error") String error);

    @Modifying
    @Query("UPDATE MercadoPagoWebhookEvent e SET e.status = 'processed', e.processedAt = :now WHERE e.id = :id")
    void markProcessed(@Param("id") Long id, @Param("now") LocalDateTime now);
}
