package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.store.StoreRequest;
import com.jafpsoft.ventas.dto.store.StoreResponse;
import com.jafpsoft.ventas.model.Store;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final CatalogRepository catalogRepository;

    @Transactional(readOnly = true)
    public List<StoreResponse> listByUser(Long userId) {
        return storeRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream().map(StoreResponse::from).toList();
    }

    @Transactional
    public StoreResponse create(StoreRequest req, Long userId) {
        String slug = req.getSlug() != null && !req.getSlug().isBlank()
                ? req.getSlug()
                : generateSlug(req.getName(), userId);
        Store store = Store.builder()
                .userId(userId)
                .name(req.getName())
                .slug(slug)
                .description(req.getDescription())
                .logoUrl(req.getLogoUrl())
                .whatsappNumber(req.getWhatsappNumber())
                .active(req.getActive() == null || req.getActive())
                .build();
        return StoreResponse.from(storeRepository.save(store));
    }

    @Transactional
    public StoreResponse update(Long storeId, StoreRequest req, Long userId) {
        Store store = findOwned(storeId, userId);
        store.setName(req.getName());
        if (req.getSlug() != null && !req.getSlug().isBlank()) {
            if (storeRepository.existsBySlugAndIdNot(req.getSlug(), storeId)) {
                throw new IllegalArgumentException("El slug '" + req.getSlug() + "' ya está en uso");
            }
            store.setSlug(req.getSlug());
        }
        if (req.getDescription() != null) store.setDescription(req.getDescription());
        if (req.getLogoUrl() != null) store.setLogoUrl(req.getLogoUrl());
        if (req.getWhatsappNumber() != null) store.setWhatsappNumber(req.getWhatsappNumber());
        if (req.getActive() != null) store.setActive(req.getActive());
        return StoreResponse.from(storeRepository.save(store));
    }

    @Transactional
    public void delete(Long storeId, Long userId) {
        Store store = findOwned(storeId, userId);
        // Unlink catalogs from this store
        catalogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(c -> storeId.equals(c.getStoreId()))
                .forEach(c -> { c.setStoreId(null); catalogRepository.save(c); });
        storeRepository.delete(store);
    }

    @Transactional
    public StoreResponse assignCatalog(Long storeId, Long catalogId, Long userId) {
        Store store = findOwned(storeId, userId);
        catalogRepository.findByIdAndUserId(catalogId, userId)
                .ifPresent(c -> { c.setStoreId(storeId); catalogRepository.save(c); });
        return StoreResponse.from(store);
    }

    @Transactional
    public void unassignCatalog(Long catalogId, Long userId) {
        catalogRepository.findByIdAndUserId(catalogId, userId)
                .ifPresent(c -> { c.setStoreId(null); catalogRepository.save(c); });
    }

    public String suggestSlug(String name, Long userId) {
        return generateSlug(name, userId);
    }

    private String generateSlug(String name, Long userId) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "").toLowerCase().trim()
                .replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (base.length() > 36) base = base.substring(0, 36);
        String slug = base;
        int i = 1;
        while (storeRepository.existsBySlugAndIdNot(slug, -1L)) {
            slug = base + "-" + i++;
        }
        return slug;
    }

    private Store findOwned(Long id, Long userId) {
        return storeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException("Local no encontrado"));
    }
}
