package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.rubro.RubroRequest;
import com.jafpsoft.ventas.dto.rubro.RubroResponse;
import com.jafpsoft.ventas.model.Rubro;
import com.jafpsoft.ventas.repository.RubroRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RubroService {

    private final RubroRepository rubroRepository;

    private static final String[][] DEFAULTS = {
        {"ropa",         "Ropa"},
        {"calzado",      "Calzado"},
        {"accesorios",   "Accesorios"},
        {"alimentos",    "Alimentos"},
        {"bebidas",      "Bebidas"},
        {"hogar_cocina", "Hogar y Cocina"},
        {"electronica",  "Electrónica"},
        {"belleza",      "Belleza"},
        {"deportes",     "Deportes"},
        {"mascotas",     "Mascotas"},
    };

    @PostConstruct
    @Transactional
    public void seed() {
        if (rubroRepository.count() == 0) {
            for (int i = 0; i < DEFAULTS.length; i++) {
                rubroRepository.save(Rubro.builder()
                        .value(DEFAULTS[i][0])
                        .label(DEFAULTS[i][1])
                        .sortOrder(i)
                        .active(true)
                        .build());
            }
        }
    }

    public List<RubroResponse> listAll() {
        return rubroRepository.findAllByOrderBySortOrderAscLabelAsc()
                .stream().map(RubroResponse::from).toList();
    }

    public List<RubroResponse> listActive() {
        return rubroRepository.findByActiveTrueOrderBySortOrderAscLabelAsc()
                .stream().map(RubroResponse::from).toList();
    }

    @Transactional
    public RubroResponse create(RubroRequest req) {
        if (req.getValue() == null || req.getValue().isBlank()) throw new IllegalArgumentException("value requerido");
        if (req.getLabel() == null || req.getLabel().isBlank()) throw new IllegalArgumentException("label requerido");
        String value = req.getValue().trim().toLowerCase().replaceAll("\\s+", "_");
        if (rubroRepository.existsByValue(value)) throw new IllegalArgumentException("Ya existe un rubro con ese valor");
        Rubro r = Rubro.builder()
                .value(value)
                .label(req.getLabel().trim())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 99)
                .active(true)
                .build();
        return RubroResponse.from(rubroRepository.save(r));
    }

    @Transactional
    public RubroResponse update(Long id, RubroRequest req) {
        Rubro r = rubroRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rubro no encontrado"));
        if (req.getLabel() != null && !req.getLabel().isBlank()) r.setLabel(req.getLabel().trim());
        if (req.getSortOrder() != null) r.setSortOrder(req.getSortOrder());
        if (req.getActive() != null) r.setActive(req.getActive());
        return RubroResponse.from(rubroRepository.save(r));
    }

    @Transactional
    public void delete(Long id) {
        rubroRepository.deleteById(id);
    }
}
