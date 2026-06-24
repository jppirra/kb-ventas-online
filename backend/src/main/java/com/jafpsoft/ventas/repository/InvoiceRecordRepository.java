package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.InvoiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRecordRepository extends JpaRepository<InvoiceRecord, Long> {
    Optional<InvoiceRecord> findByCorrelationId(String correlationId);
    Optional<InvoiceRecord> findBySaleTicketId(Long saleTicketId);
    List<InvoiceRecord> findByUserIdOrderByRequestedAtDesc(Long userId);
}
