package com.jafpsoft.ventas.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.dto.order.OrderRequestPayload;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.OrderRequest;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.OrderRequestRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderRequestService {

    private final OrderRequestRepository orderRequestRepository;
    private final CatalogRepository catalogRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Transactional
    public OrderRequest submit(Long catalogId, OrderRequestPayload payload) {
        Catalog catalog = catalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));

        User vendor = userRepository.findById(catalog.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Vendedor no encontrado"));

        List<OrderRequestPayload.Item> items = payload.getItems();
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un producto");
        }

        BigDecimal total = items.stream()
                .map(i -> {
                    BigDecimal unitPrice = i.getOfferPrice() != null ? i.getOfferPrice() : i.getPrice();
                    return unitPrice != null ? unitPrice.multiply(BigDecimal.valueOf(i.getQuantity())) : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String itemsJson;
        try {
            itemsJson = objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            itemsJson = "[]";
        }

        OrderRequest order = orderRequestRepository.save(OrderRequest.builder()
                .catalogId(catalogId)
                .catalogName(catalog.getName())
                .vendorUserId(vendor.getId())
                .customerName(payload.getCustomerName())
                .itemsJson(itemsJson)
                .total(total)
                .build());

        String customerLabel = payload.getCustomerName() != null && !payload.getCustomerName().isBlank()
                ? payload.getCustomerName() : "Cliente anónimo";

        String notifMessage = buildNotifMessage(customerLabel, items, total);

        notificationService.create(
                vendor.getId(),
                "ORDER_REQUEST",
                "Nueva solicitud — " + catalog.getName(),
                notifMessage,
                order.getId()
        );

        emailService.sendOrderRequestEmail(
                vendor.getEmail(),
                vendor.getName() != null ? vendor.getName() : vendor.getEmail(),
                catalog.getName(),
                catalogId,
                customerLabel,
                items,
                total
        );

        return order;
    }

    private String buildNotifMessage(String customer, List<OrderRequestPayload.Item> items, BigDecimal total) {
        StringBuilder sb = new StringBuilder();
        sb.append(customer).append(" solicitó ").append(items.size())
          .append(items.size() == 1 ? " producto" : " productos");
        sb.append(" — Total: $").append(String.format("%,.0f", total));
        return sb.toString();
    }
}
