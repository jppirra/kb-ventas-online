package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCatalogIdOrderBySortOrderAscCreatedAtAsc(Long catalogId);
    Optional<Product> findByIdAndCatalogId(Long id, Long catalogId);
    List<Product> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Product> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("UPDATE Product p SET p.catalog = null WHERE p.catalog.id = :catalogId")
    void unlinkAllFromCatalog(@Param("catalogId") Long catalogId);
}
