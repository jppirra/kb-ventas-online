package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Rubro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RubroRepository extends JpaRepository<Rubro, Long> {
    List<Rubro> findAllByOrderBySortOrderAscLabelAsc();
    List<Rubro> findByActiveTrueOrderBySortOrderAscLabelAsc();
    Optional<Rubro> findByValue(String value);
    boolean existsByValue(String value);
}
