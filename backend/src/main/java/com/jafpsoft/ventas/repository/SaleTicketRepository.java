package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.SaleTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SaleTicketRepository extends JpaRepository<SaleTicket, Long> {
    List<SaleTicket> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<SaleTicket> findByIdAndUserId(Long id, Long userId);
    Optional<SaleTicket> findByPublicToken(String publicToken);
    long countByUserId(Long userId);
}
