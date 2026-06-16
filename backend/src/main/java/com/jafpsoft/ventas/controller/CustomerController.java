package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.customer.CustomerRequest;
import com.jafpsoft.ventas.dto.customer.CustomerResponse;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public List<CustomerResponse> list(@AuthenticationPrincipal CustomUserDetails principal) {
        return customerService.list(principal.getUserId());
    }

    @PostMapping
    public CustomerResponse create(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody CustomerRequest req) {
        return customerService.create(principal.getUserId(), req);
    }

    @PutMapping("/{id}")
    public CustomerResponse update(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id,
            @RequestBody CustomerRequest req) {
        return customerService.update(principal.getUserId(), id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long id) {
        customerService.delete(principal.getUserId(), id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check-order/{orderId}")
    public Map<String, Boolean> checkOrder(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long orderId) {
        return Map.of("exists", customerService.existsFromOrder(principal.getUserId(), orderId));
    }
}
