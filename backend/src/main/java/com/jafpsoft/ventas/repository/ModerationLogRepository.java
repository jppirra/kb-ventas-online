package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.ModerationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModerationLogRepository extends JpaRepository<ModerationLog, Long> {

    List<ModerationLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);
}
