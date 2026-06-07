package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.order.OrderResponse;
import com.jafpsoft.ventas.dto.order.OrderUpdateRequest;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.OrderRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRequestService orderRequestService;

    @GetMapping
    public List<OrderResponse> list(@AuthenticationPrincipal CustomUserDetails user) {
        return orderRequestService.listForVendor(user.getUserId());
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        return orderRequestService.getForVendor(id, user.getUserId());
    }

    @PutMapping("/{id}")
    public OrderResponse update(@PathVariable Long id,
                                @RequestBody OrderUpdateRequest req,
                                @AuthenticationPrincipal CustomUserDetails user) {
        return orderRequestService.update(id, user.getUserId(), req);
    }
}
