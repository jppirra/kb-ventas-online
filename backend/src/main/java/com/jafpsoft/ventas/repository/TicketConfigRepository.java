package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.TicketConfig;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TicketConfigRepository extends JpaRepository<TicketConfig, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM TicketConfig c WHERE c.userId = :userId")
    Optional<TicketConfig> findByIdForUpdate(@Param("userId") Long userId);
}
