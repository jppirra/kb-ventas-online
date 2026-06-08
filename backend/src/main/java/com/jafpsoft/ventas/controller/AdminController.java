package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.admin.*;
import com.jafpsoft.ventas.model.EmailLog;
import com.jafpsoft.ventas.repository.EmailLogRepository;
import com.jafpsoft.ventas.service.AdminService;
import com.jafpsoft.ventas.service.AiService;
import com.jafpsoft.ventas.service.AppSettingService;
import com.jafpsoft.ventas.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
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
    private final EmailService emailService;
    private final EmailLogRepository emailLogRepository;

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

    @PostMapping("/email-test")
    public ResponseEntity<Map<String, String>> sendTestEmail(@RequestParam String toEmail) {
        emailService.sendTestEmail(toEmail);
        return ResponseEntity.ok(Map.of("message", "Email de prueba enviado a " + toEmail));
    }

    @GetMapping("/email-logs")
    public ResponseEntity<Map<String, Object>> emailLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Page<EmailLog> p = emailLogRepository.findAllByOrderBySentAtDesc(PageRequest.of(page, size));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", p.getContent());
        result.put("totalElements", p.getTotalElements());
        result.put("totalPages", p.getTotalPages());
        result.put("number", p.getNumber());
        return ResponseEntity.ok(result);
    }

    // ── Email settings ────────────────────────────────────────────────────────
    private static final List<String> EMAIL_SETTING_KEYS = List.of(
            "email.from_name",
            "email.primary_color",
            "email.verification.subject",
            "email.verification.cta_text",
            "email.verification.footer",
            "email.reset.subject",
            "email.reset.cta_text",
            "email.reset.footer"
    );

    private static final Map<String, String> EMAIL_SETTING_DEFAULTS = Map.of(
            "email.from_name", "Mercato",
            "email.primary_color", "#6366f1",
            "email.verification.subject", "Activá tu cuenta en Mercato",
            "email.verification.cta_text", "Activar mi cuenta →",
            "email.verification.footer", "Este link expira en 24 horas.",
            "email.reset.subject", "Restablecer contraseña — Mercato",
            "email.reset.cta_text", "Restablecer contraseña →",
            "email.reset.footer", "Este link expira en 24 horas. Si no solicitaste esto, podés ignorarlo."
    );

    @GetMapping("/settings/email")
    public ResponseEntity<List<Map<String, String>>> getEmailSettings() {
        List<Map<String, String>> result = EMAIL_SETTING_KEYS.stream().map(key -> {
            String value = appSettingService.get(key, EMAIL_SETTING_DEFAULTS.getOrDefault(key, ""));
            return Map.of("key", key, "value", value);
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/settings/email")
    public ResponseEntity<Map<String, String>> saveEmailSettings(@RequestBody Map<String, String> body) {
        body.forEach((key, value) -> {
            if (EMAIL_SETTING_KEYS.contains(key)) {
                appSettingService.set(key, value);
            }
        });
        return ResponseEntity.ok(Map.of("message", "Configuración guardada"));
    }
}
