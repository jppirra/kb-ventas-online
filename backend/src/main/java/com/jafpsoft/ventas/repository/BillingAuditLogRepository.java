package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.BillingAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillingAuditLogRepository extends JpaRepository<BillingAuditLog, Long> {
    List<BillingAuditLog> findByUserIdAndCorrelationIdOrderByCreatedAtDesc(Long userId, String correlationId);
    List<BillingAuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
}
