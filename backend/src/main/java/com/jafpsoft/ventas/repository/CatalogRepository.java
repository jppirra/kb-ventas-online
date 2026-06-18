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
    Optional<Catalog> findByPublicId(String publicId);
    long countByUserIdAndActive(Long userId, boolean active);

    @Query(value = "SELECT COALESCE(SUM(view_count), 0) FROM catalogs WHERE user_id = :userId AND is_active = true", nativeQuery = true)
    Long sumViewCountByUserId(@Param("userId") Long userId);

    @Query(value = """
            SELECT c.* FROM catalogs c
            JOIN users u ON u.id = c.user_id
            WHERE c.is_active = true
              AND c.published_snapshot_json IS NOT NULL
              AND u.enabled = true
              AND (:rubro IS NULL OR c.rubro = :rubro)
              AND (:q IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
                             OR LOWER(c.description) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY c.view_count DESC
            LIMIT 60
            """, nativeQuery = true)
    List<Catalog> searchPublished(@Param("rubro") String rubro, @Param("q") String q);

    @Query(value = """
            SELECT c.* FROM catalogs c
            JOIN users u ON u.id = c.user_id
            WHERE c.is_active = true
              AND c.published_snapshot_json IS NOT NULL
              AND u.enabled = true
            ORDER BY c.view_count DESC
            LIMIT 5
            """, nativeQuery = true)
    List<Catalog> findTopFeatured();
}
