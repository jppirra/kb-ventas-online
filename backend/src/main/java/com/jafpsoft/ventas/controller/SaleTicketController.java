package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.ticket.*;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.SaleTicketService;
import com.jafpsoft.ventas.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class SaleTicketController {

    private final SaleTicketService service;
    private final StorageService storageService;

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
}
