package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.CatalogReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogReportRepository extends JpaRepository<CatalogReport, Long> {
    long countByCatalogId(Long catalogId);
    List<CatalogReport> findByCatalogIdOrderByCreatedAtDesc(Long catalogId);
    void deleteAllByCatalogId(Long catalogId);
}
