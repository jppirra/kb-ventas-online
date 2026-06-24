package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.billing.InvoiceRecordResponse;
import com.jafpsoft.ventas.dto.billing.IssueInvoiceRequest;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.ElectronicInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final ElectronicInvoiceService service;

    @PostMapping("/issue")
    public ResponseEntity<InvoiceRecordResponse> issueInvoice(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody IssueInvoiceRequest body) {
        return ResponseEntity.ok(service.issueInvoice(user.getUserId(), body));
    }

    @GetMapping("/records")
    public ResponseEntity<List<InvoiceRecordResponse>> listRecords(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(service.getInvoices(user.getUserId()));
    }

    @GetMapping("/records/ticket/{ticketId}")
    public ResponseEntity<InvoiceRecordResponse> getByTicket(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long ticketId) {
        return service.getByTicket(user.getUserId(), ticketId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
