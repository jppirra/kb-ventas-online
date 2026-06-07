package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.dashboard.DashboardStatsResponse;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.OrderRequestRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final OrderRequestRepository orderRepository;

    @GetMapping("/stats")
    public DashboardStatsResponse stats(@AuthenticationPrincipal CustomUserDetails user) {
        Long userId = user.getUserId();
        return DashboardStatsResponse.builder()
                .totalCatalogs(catalogRepository.countByUserIdAndActive(userId, true))
                .totalProducts(productRepository.countByUserId(userId))
                .totalOrders(orderRepository.countByVendorUserId(userId))
                .pendingOrders(orderRepository.countByVendorUserIdAndStatus(userId, "PENDING"))
                .totalViews(catalogRepository.sumViewCountByUserId(userId))
                .build();
    }
}
