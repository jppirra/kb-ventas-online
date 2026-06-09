package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.dashboard.DashboardStatsResponse;
import com.jafpsoft.ventas.model.SaleTicket;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.OrderRequestRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.SaleTicketRepository;
import com.jafpsoft.ventas.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final OrderRequestRepository orderRepository;
    private final SaleTicketRepository ticketRepository;

    @GetMapping("/stats")
    public DashboardStatsResponse stats(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) String month) {

        Long userId = user.getUserId();

        YearMonth ym;
        try {
            ym = (month != null && !month.isBlank()) ? YearMonth.parse(month) : YearMonth.now();
        } catch (DateTimeParseException e) {
            ym = YearMonth.now();
        }

        LocalDateTime start = ym.atDay(1).atStartOfDay();
        LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();

        List<SaleTicket> monthTickets = ticketRepository.findActiveByUserIdBetween(userId, start, end);

        long totalTickets = monthTickets.size();
        BigDecimal totalRevenue = monthTickets.stream()
                .map(SaleTicket::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalCustomers = monthTickets.stream()
                .map(t -> t.getCustomerPhone() != null && !t.getCustomerPhone().isBlank()
                        ? t.getCustomerPhone().trim()
                        : t.getCustomerEmail() != null && !t.getCustomerEmail().isBlank()
                        ? t.getCustomerEmail().trim()
                        : null)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        return DashboardStatsResponse.builder()
                .totalCatalogs(catalogRepository.countByUserIdAndActive(userId, true))
                .totalProducts(productRepository.countByUserId(userId))
                .totalOrders(orderRepository.countByVendorUserId(userId))
                .pendingOrders(orderRepository.countByVendorUserIdAndStatus(userId, "PENDING"))
                .totalViews(catalogRepository.sumViewCountByUserId(userId))
                .totalTickets(totalTickets)
                .totalRevenue(totalRevenue)
                .totalCustomers(totalCustomers)
                .month(ym.toString())
                .build();
    }
}
