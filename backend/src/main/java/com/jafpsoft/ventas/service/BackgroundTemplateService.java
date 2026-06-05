package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.admin.BackgroundTemplateRequest;
import com.jafpsoft.ventas.dto.admin.BackgroundTemplateResponse;
import com.jafpsoft.ventas.model.BackgroundTemplate;
import com.jafpsoft.ventas.repository.BackgroundTemplateRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BackgroundTemplateService {

    private final BackgroundTemplateRepository repository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<BackgroundTemplateResponse> listAll() {
        return repository.findAll().stream().map(BackgroundTemplateResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<BackgroundTemplateResponse> listActive() {
        return repository.findByActiveTrueOrderBySortOrderAscCreatedAtAsc()
                .stream().map(BackgroundTemplateResponse::from).toList();
    }

    @Transactional
    public BackgroundTemplateResponse create(BackgroundTemplateRequest req) {
        BackgroundTemplate t = BackgroundTemplate.builder()
                .name(req.getName())
                .imageUrl(req.getImageUrl())
                .description(req.getDescription())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .active(req.getActive() == null || req.getActive())
                .build();
        return BackgroundTemplateResponse.from(repository.save(t));
    }

    @Transactional
    public BackgroundTemplateResponse update(Long id, BackgroundTemplateRequest req) {
        BackgroundTemplate t = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Fondo no encontrado"));
        t.setName(req.getName());
        if (req.getImageUrl() != null) t.setImageUrl(req.getImageUrl());
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getSortOrder() != null) t.setSortOrder(req.getSortOrder());
        if (req.getActive() != null) t.setActive(req.getActive());
        return BackgroundTemplateResponse.from(repository.save(t));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public Map<String, String> uploadImage(Long id, MultipartFile file) throws IOException {
        BackgroundTemplate t = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Fondo no encontrado"));
        String url = storageService.uploadImage(file, "backgrounds");
        t.setImageUrl(url);
        repository.save(t);
        return Map.of("imageUrl", url);
    }
}
