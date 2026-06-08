package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.admin.*;
import com.jafpsoft.ventas.service.AdminService;
import com.jafpsoft.ventas.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<Map<String, String>> testAi() {
        String result = aiService.testConnection();
        return ResponseEntity.ok(Map.of("result", result));
    }

    @GetMapping("/ai/models")
    public ResponseEntity<List<String>> listModels() {
        return ResponseEntity.ok(aiService.listAvailableModels());
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    @PostMapping("/email/send")
    public ResponseEntity<Map<String, String>> sendEmail(@Valid @RequestBody AdminEmailRequest req) {
        adminService.sendTestEmail(req);
        return ResponseEntity.ok(Map.of("message", "Email enviado a " + req.getTo()));
    }
}
