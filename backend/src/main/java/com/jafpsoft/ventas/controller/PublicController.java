package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.admin.BackgroundTemplateResponse;
import com.jafpsoft.ventas.dto.profile.PublicCatalogPageResponse;
import com.jafpsoft.ventas.dto.profile.PublicProfileResponse;
import com.jafpsoft.ventas.service.BackgroundTemplateService;
import com.jafpsoft.ventas.service.PublicProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicProfileService publicProfileService;
    private final BackgroundTemplateService backgroundTemplateService;

    @GetMapping("/p/{slug}")
    public PublicProfileResponse getProfile(@PathVariable String slug) {
        return publicProfileService.getPublicProfile(slug);
    }

    @GetMapping("/catalog/{catalogId}")
    public PublicCatalogPageResponse getCatalog(@PathVariable Long catalogId) {
        return publicProfileService.getCatalogById(catalogId);
    }

    @GetMapping("/backgrounds")
    public List<BackgroundTemplateResponse> backgrounds() {
        return backgroundTemplateService.listActive();
    }

    @PostMapping("/analytics/catalog/{catalogId}/view")
    public ResponseEntity<Map<String, String>> catalogView(@PathVariable Long catalogId) {
        publicProfileService.registerCatalogView(catalogId);
        return ResponseEntity.ok(Map.of("ok", "true"));
    }

    @PostMapping("/analytics/product/{productId}/whatsapp")
    public ResponseEntity<Map<String, String>> whatsappClick(@PathVariable Long productId) {
        publicProfileService.registerWhatsappClick(productId);
        return ResponseEntity.ok(Map.of("ok", "true"));
    }
}
