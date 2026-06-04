package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Catalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogRepository extends JpaRepository<Catalog, Long> {
    List<Catalog> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Catalog> findByIdAndUserId(Long id, Long userId);
}
