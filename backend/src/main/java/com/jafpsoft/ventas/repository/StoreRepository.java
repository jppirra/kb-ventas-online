package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByUserIdOrderByCreatedAtAsc(Long userId);
    Optional<Store> findByIdAndUserId(Long id, Long userId);
    Optional<Store> findBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
}
