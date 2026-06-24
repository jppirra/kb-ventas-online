package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.billing.FiscalConfigRequest;
import com.jafpsoft.ventas.dto.billing.FiscalConfigResponse;
import com.jafpsoft.ventas.dto.billing.TestConnectionResponse;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.ElectronicInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/billing/config")
@RequiredArgsConstructor
public class BillingConfigController {

    private final ElectronicInvoiceService service;

    @GetMapping
    public ResponseEntity<FiscalConfigResponse> getConfig(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(service.getConfig(user.getUserId()));
    }

    @PutMapping
    public ResponseEntity<FiscalConfigResponse> updateConfig(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody FiscalConfigRequest body) {
        return ResponseEntity.ok(service.updateConfig(user.getUserId(), body));
    }

    @PostMapping("/cert")
    public ResponseEntity<FiscalConfigResponse> uploadCert(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam("file") MultipartFile file,
            @RequestParam("password") String password) {
        return ResponseEntity.ok(service.uploadCertificate(user.getUserId(), file, password));
    }

    @GetMapping("/test-connection")
    public ResponseEntity<TestConnectionResponse> testConnection(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(service.testConnection(user.getUserId()));
    }
}
