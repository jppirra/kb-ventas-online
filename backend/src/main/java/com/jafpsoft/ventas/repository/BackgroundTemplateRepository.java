package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.BackgroundTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BackgroundTemplateRepository extends JpaRepository<BackgroundTemplate, Long> {
    List<BackgroundTemplate> findByActiveTrueOrderBySortOrderAscCreatedAtAsc();
}
