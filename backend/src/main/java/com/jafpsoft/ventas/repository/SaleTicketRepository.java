package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.SaleTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SaleTicketRepository extends JpaRepository<SaleTicket, Long> {
    List<SaleTicket> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<SaleTicket> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);

    @Query("SELECT t FROM SaleTicket t WHERE t.userId = :userId AND t.status <> 'CANCELLED' AND t.createdAt >= :start AND t.createdAt < :end ORDER BY t.createdAt DESC")
    List<SaleTicket> findActiveByUserIdBetween(@Param("userId") Long userId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT t FROM SaleTicket t WHERE t.userId = :userId AND t.status <> 'CANCELLED' ORDER BY t.createdAt DESC")
    List<SaleTicket> findActiveByUserId(@Param("userId") Long userId);
}
