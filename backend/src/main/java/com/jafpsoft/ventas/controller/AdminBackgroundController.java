package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.admin.BackgroundTemplateRequest;
import com.jafpsoft.ventas.dto.admin.BackgroundTemplateResponse;
import com.jafpsoft.ventas.service.BackgroundTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/backgrounds")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBackgroundController {

    private final BackgroundTemplateService service;

    @GetMapping
    public List<BackgroundTemplateResponse> list() {
        return service.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BackgroundTemplateResponse create(@Valid @RequestBody BackgroundTemplateRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public BackgroundTemplateResponse update(@PathVariable Long id,
                                             @Valid @RequestBody BackgroundTemplateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@PathVariable Long id,
                                                           @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(service.uploadImage(id, file));
    }
}
