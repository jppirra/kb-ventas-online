package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.payment.MercadoPagoConnectRequest;
import com.jafpsoft.ventas.dto.payment.MercadoPagoConnectResponse;
import com.jafpsoft.ventas.dto.payment.MercadoPagoPaymentStatusResponse;
import com.jafpsoft.ventas.dto.payment.MercadoPagoPreferenceResponse;
import com.jafpsoft.ventas.dto.ticket.*;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.MercadoPagoOAuthService;
import com.jafpsoft.ventas.service.MercadoPagoPaymentService;
import com.jafpsoft.ventas.service.SaleTicketService;
import com.jafpsoft.ventas.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class SaleTicketController {

    private final SaleTicketService service;
    private final StorageService storageService;
    private final MercadoPagoOAuthService mpOAuthService;
    private final MercadoPagoPaymentService mpPaymentService;

    @GetMapping
    public List<TicketResponse> list(@AuthenticationPrincipal CustomUserDetails user) {
        return service.listByUser(user.getUserId());
    }

    @GetMapping("/{id}")
    public TicketResponse get(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        return service.getById(id, user.getUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(@Valid @RequestBody TicketRequest req,
                                 @AuthenticationPrincipal CustomUserDetails user) {
        return service.create(req, user.getUserId());
    }

    @PatchMapping("/{id}/status")
    public TicketResponse updateStatus(@PathVariable Long id,
                                       @RequestBody Map<String, String> body,
                                       @AuthenticationPrincipal CustomUserDetails user) {
        return service.updateStatus(id, user.getUserId(), body.get("status"));
    }

    @PatchMapping("/{id}/cancel")
    public TicketResponse cancel(@PathVariable Long id,
                                 @RequestBody Map<String, String> body,
                                 @AuthenticationPrincipal CustomUserDetails user) {
        return service.cancel(id, user.getUserId(), body.get("reason"));
    }

    @PostMapping("/{id}/send-email")
    public ResponseEntity<Map<String, String>> sendEmail(@PathVariable Long id,
                                                         @AuthenticationPrincipal CustomUserDetails user) {
        service.sendTicketEmail(id, user.getUserId());
        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    @PatchMapping("/{id}/customer")
    public TicketResponse updateCustomer(@PathVariable Long id,
                                         @RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal CustomUserDetails user) {
        return service.updateCustomer(id, user.getUserId(), body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        service.delete(id, user.getUserId());
    }

    // ── Ticket config ─────────────────────────────────────────────────────────

    @GetMapping("/config")
    public TicketConfigResponse getConfig(@AuthenticationPrincipal CustomUserDetails user) {
        return service.getConfig(user.getUserId());
    }

    @PutMapping("/config")
    public TicketConfigResponse saveConfig(@RequestBody TicketConfigRequest req,
                                           @AuthenticationPrincipal CustomUserDetails user) {
        return service.saveConfig(user.getUserId(), req);
    }

    @PostMapping("/config/upload-logo")
    public ResponseEntity<Map<String, String>> uploadLogo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        String url = storageService.uploadImage(file, "ticket-logos");
        TicketConfigRequest req = new TicketConfigRequest();
        req.setLogoUrl(url);
        service.saveConfig(user.getUserId(), req);
        return ResponseEntity.ok(Map.of("logoUrl", url));
    }

    // ── Mercado Pago OAuth ────────────────────────────────────────────────────

    @GetMapping("/config/mercadopago/auth-url")
    public Map<String, String> getMpAuthUrl(@AuthenticationPrincipal CustomUserDetails user) {
        return mpOAuthService.buildAuthorizationUrl(user.getUserId());
    }

    @PostMapping("/config/mercadopago/connect")
    public MercadoPagoConnectResponse connectMp(@RequestBody MercadoPagoConnectRequest req,
                                                 @AuthenticationPrincipal CustomUserDetails user) {
        return mpOAuthService.connectAccount(user.getUserId(), req);
    }

    @GetMapping("/config/mercadopago/status")
    public MercadoPagoConnectResponse getMpStatus(@AuthenticationPrincipal CustomUserDetails user) {
        return mpOAuthService.getStatus(user.getUserId());
    }

    @DeleteMapping("/config/mercadopago")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disconnectMp(@AuthenticationPrincipal CustomUserDetails user) {
        mpOAuthService.disconnectAccount(user.getUserId());
    }

    // ── Mercado Pago Pagos ────────────────────────────────────────────────────

    @PostMapping("/{id}/payment/mercadopago")
    public MercadoPagoPreferenceResponse createMpPayment(@PathVariable Long id,
                                                          @AuthenticationPrincipal CustomUserDetails user) {
        String correlationId = MDC.get("correlationId") != null ? MDC.get("correlationId") : UUID.randomUUID().toString();
        return mpPaymentService.createPreference(id, user.getUserId(), correlationId);
    }

    @GetMapping("/{id}/payment/status")
    public MercadoPagoPaymentStatusResponse getPaymentStatus(@PathVariable Long id,
                                                              @AuthenticationPrincipal CustomUserDetails user) {
        return mpPaymentService.getPaymentStatus(id, user.getUserId());
    }

    @PostMapping("/{id}/payment/reset")
    public TicketResponse resetPayment(@PathVariable Long id,
                                        @AuthenticationPrincipal CustomUserDetails user) {
        return mpPaymentService.resetPaymentAttempt(id, user.getUserId());
    }

    // ── QR de venta presencial ────────────────────────────────────────────────

    @PostMapping("/qr/mercadopago")
    public MercadoPagoPreferenceResponse generateQrPreference(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails user) {
        java.math.BigDecimal amount = new java.math.BigDecimal(
            body.getOrDefault("amount", "0").toString());
        String description = (String) body.getOrDefault("description", "Venta presencial");
        String correlationId = MDC.get("correlationId") != null
            ? MDC.get("correlationId") : UUID.randomUUID().toString();
        return mpPaymentService.generateQrPreference(user.getUserId(), amount, description, correlationId);
    }
}
