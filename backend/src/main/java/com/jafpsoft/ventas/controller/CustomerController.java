package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.customer.CustomerResponse;
import com.jafpsoft.ventas.model.SaleTicket;
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
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final SaleTicketRepository ticketRepository;

    @GetMapping
    public List<CustomerResponse> list(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) String month) {

        Long userId = user.getUserId();
        List<SaleTicket> tickets;

        if (month != null && !month.isBlank()) {
            YearMonth ym;
            try { ym = YearMonth.parse(month); } catch (DateTimeParseException e) { ym = YearMonth.now(); }
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();
            tickets = ticketRepository.findActiveByUserIdBetween(userId, start, end);
        } else {
            tickets = ticketRepository.findActiveByUserId(userId);
        }

        // Group by identity key: phone first, then email, then skip
        Map<String, List<SaleTicket>> grouped = new LinkedHashMap<>();
        for (SaleTicket t : tickets) {
            String key = null;
            if (t.getCustomerPhone() != null && !t.getCustomerPhone().isBlank()) {
                key = "p:" + t.getCustomerPhone().trim();
            } else if (t.getCustomerEmail() != null && !t.getCustomerEmail().isBlank()) {
                key = "e:" + t.getCustomerEmail().trim();
            }
            if (key != null) {
                grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(t);
            }
        }

        return grouped.values().stream().map(group -> {
            SaleTicket last = group.stream()
                    .max(Comparator.comparing(SaleTicket::getCreatedAt))
                    .orElse(group.get(0));
            BigDecimal spent = group.stream()
                    .map(SaleTicket::getTotal)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            return CustomerResponse.builder()
                    .customerName(last.getCustomerName())
                    .customerPhone(last.getCustomerPhone())
                    .customerEmail(last.getCustomerEmail())
                    .totalOrders(group.size())
                    .totalSpent(spent)
                    .lastPurchaseAt(last.getCreatedAt())
                    .build();
        })
        .sorted(Comparator.comparing(CustomerResponse::getLastPurchaseAt, Comparator.nullsLast(Comparator.reverseOrder())))
        .collect(Collectors.toList());
    }
}
