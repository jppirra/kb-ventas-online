package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.admin.BackgroundTemplateResponse;
import com.jafpsoft.ventas.dto.order.OrderRequestPayload;
import com.jafpsoft.ventas.dto.profile.ExplorarResponse;
import com.jafpsoft.ventas.dto.profile.PublicCatalogPageResponse;
import com.jafpsoft.ventas.dto.profile.PublicProfileResponse;
import com.jafpsoft.ventas.dto.report.ReportRequest;
import com.jafpsoft.ventas.dto.store.PublicStoreResponse;
import com.jafpsoft.ventas.service.BackgroundTemplateService;
import com.jafpsoft.ventas.service.OrderRequestService;
import com.jafpsoft.ventas.service.PublicProfileService;
import com.jafpsoft.ventas.service.ReportService;
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
    private final OrderRequestService orderRequestService;
    private final ReportService reportService;

    @GetMapping("/p/{slug}")
    public PublicProfileResponse getProfile(@PathVariable String slug) {
        return publicProfileService.getPublicProfile(slug);
    }

    @GetMapping("/s/{storeSlug}")
    public PublicStoreResponse getPublicStore(@PathVariable String storeSlug) {
        return publicProfileService.getPublicStore(storeSlug);
    }

    @GetMapping("/catalog/{publicId}")
    public PublicCatalogPageResponse getCatalog(@PathVariable String publicId) {
        return publicProfileService.getCatalogByPublicId(publicId);
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

    @PostMapping("/analytics/profile/{slug}/view")
    public ResponseEntity<Map<String, String>> profileView(@PathVariable String slug) {
        publicProfileService.registerProfileView(slug);
        return ResponseEntity.ok(Map.of("ok", "true"));
    }

    @PostMapping("/analytics/product/{productId}/whatsapp")
    public ResponseEntity<Map<String, String>> whatsappClick(@PathVariable Long productId) {
        publicProfileService.registerWhatsappClick(productId);
        return ResponseEntity.ok(Map.of("ok", "true"));
    }

    @PostMapping("/catalog/{catalogId}/order-request")
    public ResponseEntity<Map<String, Long>> submitOrderRequest(
            @PathVariable Long catalogId,
            @RequestBody OrderRequestPayload payload) {
        var order = orderRequestService.submit(catalogId, payload);
        return ResponseEntity.ok(Map.of("orderId", order.getId()));
    }

    @GetMapping("/catalogs/search")
    public ExplorarResponse searchCatalogs(
            @RequestParam(required = false) String rubro,
            @RequestParam(required = false) String q) {
        return publicProfileService.searchCatalogs(rubro, q);
    }

    @PostMapping("/catalog/{publicId}/report")
    public ResponseEntity<Map<String, String>> reportCatalog(
            @PathVariable String publicId,
            @RequestBody ReportRequest req) {
        reportService.report(publicId, req.getReason(), req.getDetails());
        return ResponseEntity.ok(Map.of("message", "Denuncia registrada"));
    }
}
