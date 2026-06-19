package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.dashboard.DashboardStatsResponse;
import com.jafpsoft.ventas.dto.dashboard.TopProductResponse;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.OrderRequestRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.SaleTicketItemRepository;
import com.jafpsoft.ventas.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final OrderRequestRepository orderRepository;
    private final SaleTicketItemRepository saleTicketItemRepository;

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

    @GetMapping("/top-products")
    public Map<String, List<TopProductResponse>> topProducts(@AuthenticationPrincipal CustomUserDetails user) {
        List<Object[]> rows = saleTicketItemRepository.findTopSoldByUserId(user.getUserId());
        List<TopProductResponse> all = rows.stream()
                .map(r -> new TopProductResponse(
                        (String) r[0],
                        ((Number) r[1]).longValue(),
                        ((Number) r[2]).longValue()))
                .toList();
        int size = Math.min(5, all.size());
        List<TopProductResponse> top = all.subList(0, size);
        List<TopProductResponse> least = all.size() > 5
                ? all.subList(Math.max(5, all.size() - 5), all.size()).reversed()
                : List.of();
        return Map.of("top", top, "least", least);
    }
}
