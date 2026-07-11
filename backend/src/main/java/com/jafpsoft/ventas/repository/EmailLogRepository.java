package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    Page<EmailLog> findAllByOrderBySentAtDesc(Pageable pageable);
    boolean existsByToEmailAndType(String toEmail, String type);
}
