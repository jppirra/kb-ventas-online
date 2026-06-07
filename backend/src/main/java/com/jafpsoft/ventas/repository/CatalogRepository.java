package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Catalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CatalogRepository extends JpaRepository<Catalog, Long> {
    List<Catalog> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Catalog> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndActive(Long userId, boolean active);

    @Query("SELECT COALESCE(SUM(c.viewCount), 0) FROM Catalog c WHERE c.userId = :userId AND c.active = true")
    Long sumViewCountByUserId(@Param("userId") Long userId);
}
