package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Catalog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CatalogRepository extends JpaRepository<Catalog, Long> {
    List<Catalog> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Catalog> findByIdAndUserId(Long id, Long userId);
    Optional<Catalog> findByPublicId(String publicId);
    long countByUserIdAndActive(Long userId, boolean active);

    @Query(value = "SELECT COALESCE(SUM(view_count), 0) FROM catalogs WHERE user_id = :userId AND is_active = true", nativeQuery = true)
    Long sumViewCountByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Catalog c WHERE c.active = true AND c.publishedSnapshotJson IS NOT NULL " +
           "AND c.userId IN (SELECT u.id FROM User u WHERE u.enabled = true) " +
           "ORDER BY c.viewCount DESC")
    List<Catalog> findAllPublished(Pageable pageable);

    @Query("SELECT c FROM Catalog c WHERE c.active = true AND c.publishedSnapshotJson IS NOT NULL " +
           "AND c.userId IN (SELECT u.id FROM User u WHERE u.enabled = true) " +
           "ORDER BY c.viewCount DESC")
    List<Catalog> findTopFeatured(Pageable pageable);
}
