package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.admin.*;
import com.jafpsoft.ventas.service.AdminService;
import com.jafpsoft.ventas.service.AiService;
import com.jafpsoft.ventas.service.AppSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AiService aiService;
    private final AppSettingService appSettingService;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${openrouter.api-key:}")
    private String openrouterApiKey;

    @Value("${openrouter.model:liquid/lfm-2.5-1.2b-instruct:free}")
    private String openrouterModelDefault;

    // ── Stats ─────────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.getStats();
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    public List<AdminUserResponse> users() {
        return adminService.getAllUsers();
    }

    @PatchMapping("/users/{id}/toggle-enabled")
    public AdminUserResponse toggleEnabled(@PathVariable Long id) {
        return adminService.toggleUserEnabled(id);
    }

    @PatchMapping("/users/{id}/toggle-admin")
    public AdminUserResponse toggleAdmin(@PathVariable Long id) {
        return adminService.toggleUserAdmin(id);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
    }

    // ── Catalogs ──────────────────────────────────────────────────────────────
    @GetMapping("/catalogs")
    public List<AdminCatalogResponse> catalogs() {
        return adminService.getAllCatalogs();
    }

    @PatchMapping("/catalogs/{id}/toggle-active")
    public AdminCatalogResponse toggleCatalogActive(@PathVariable Long id) {
        return adminService.toggleCatalogActive(id);
    }

    @DeleteMapping("/catalogs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCatalog(@PathVariable Long id) {
        adminService.deleteCatalog(id);
    }

    // ── Orders ────────────────────────────────────────────────────────────────
    @GetMapping("/orders")
    public List<AdminOrderResponse> orders() {
        return adminService.getAllOrders();
    }

    // ── Reports ───────────────────────────────────────────────────────────────
    @GetMapping("/reports")
    public List<AdminReportResponse> reports() {
        return adminService.getAdminReports();
    }

    // ── AI test ───────────────────────────────────────────────────────────────
    @GetMapping("/ai/test")
    public ResponseEntity<Map<String, String>> testAi(
            @RequestParam(defaultValue = "gemini") String provider,
            @RequestParam(defaultValue = "") String model) {
        String result = aiService.testConnection(provider, model);
        return ResponseEntity.ok(Map.of("result", result));
    }

    @GetMapping("/ai/models")
    public ResponseEntity<List<String>> listModels() {
        return ResponseEntity.ok(aiService.listAvailableModels());
    }

    // ── AI Settings ───────────────────────────────────────────────────────────
    @GetMapping("/settings/ai")
    public ResponseEntity<Map<String, Object>> getAiSettings() {
        String defaultProvider = (geminiApiKey != null && !geminiApiKey.isBlank()) ? "gemini" : "openrouter";
        String provider = appSettingService.get("ai.provider", defaultProvider);
        String model;
        if ("gemini".equals(provider)) {
            model = appSettingService.get("ai.model.gemini", "gemini-2.0-flash");
        } else {
            model = appSettingService.get("ai.model.openrouter", openrouterModelDefault);
        }
        return ResponseEntity.ok(Map.of(
                "provider", provider,
                "model", model,
                "geminiKeySet", geminiApiKey != null && !geminiApiKey.isBlank(),
                "openrouterKeySet", openrouterApiKey != null && !openrouterApiKey.isBlank()
        ));
    }

    @PutMapping("/settings/ai")
    public ResponseEntity<Map<String, Object>> saveAiSettings(@RequestBody Map<String, String> body) {
        String provider = body.get("provider");
        String model = body.get("model");
        if (provider != null && !provider.isBlank()) {
            appSettingService.set("ai.provider", provider);
        }
        if (model != null && !model.isBlank()) {
            String modelKey = "gemini".equals(provider) ? "ai.model.gemini" : "ai.model.openrouter";
            appSettingService.set(modelKey, model);
        }
        String defaultProvider = (geminiApiKey != null && !geminiApiKey.isBlank()) ? "gemini" : "openrouter";
        String activeProvider = appSettingService.get("ai.provider", defaultProvider);
        String activeModel;
        if ("gemini".equals(activeProvider)) {
            activeModel = appSettingService.get("ai.model.gemini", "gemini-2.0-flash");
        } else {
            activeModel = appSettingService.get("ai.model.openrouter", openrouterModelDefault);
        }
        return ResponseEntity.ok(Map.of(
                "provider", activeProvider,
                "model", activeModel,
                "geminiKeySet", geminiApiKey != null && !geminiApiKey.isBlank(),
                "openrouterKeySet", openrouterApiKey != null && !openrouterApiKey.isBlank()
        ));
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    @PostMapping("/email/send")
    public ResponseEntity<Map<String, String>> sendEmail(@Valid @RequestBody AdminEmailRequest req) {
        adminService.sendTestEmail(req);
        return ResponseEntity.ok(Map.of("message", "Email enviado a " + req.getTo()));
    }
}
