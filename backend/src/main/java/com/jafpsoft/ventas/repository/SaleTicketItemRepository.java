package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.SaleTicketItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SaleTicketItemRepository extends JpaRepository<SaleTicketItem, Long> {

    @Query("""
        SELECT sti.productName, COALESCE(sti.productId, -1), SUM(sti.quantity)
        FROM SaleTicketItem sti
        JOIN sti.ticket t
        WHERE t.userId = :userId AND t.status <> 'CANCELLED'
        GROUP BY sti.productName, sti.productId
        ORDER BY SUM(sti.quantity) DESC
        """)
    List<Object[]> findTopSoldByUserId(@Param("userId") Long userId);
}
