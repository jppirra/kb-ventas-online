package com.jafpsoft.ventas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.dto.order.OrderRequestPayload;
import com.jafpsoft.ventas.dto.ticket.TicketItemRequest;
import com.jafpsoft.ventas.dto.ticket.TicketRequest;
import com.jafpsoft.ventas.dto.ticket.TicketResponse;
import com.jafpsoft.ventas.model.OrderRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderAutoTicketService {

    private final SaleTicketService saleTicketService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    /**
     * Genera automáticamente un comprobante PAID cuando el vendedor confirma un pedido.
     * Se ejecuta en hilo separado para no bloquear la respuesta del PUT /orders/{id}.
     */
    @Async("asyncExecutor")
    public void generateFromOrder(OrderRequest order) {
        try {
            List<OrderRequestPayload.Item> items = objectMapper.readValue(
                order.getItemsJson(),
                objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, OrderRequestPayload.Item.class));

            TicketRequest req = new TicketRequest();
            req.setCustomerName(order.getCustomerName());
            req.setCustomerPhone(order.getCustomerPhone());
            req.setDraft(false);

            List<TicketItemRequest> ticketItems = items.stream().map(i -> {
                TicketItemRequest ti = new TicketItemRequest();
                ti.setProductId(i.getProductId());
                ti.setProductName(i.getProductName() != null ? i.getProductName() : "Producto");
                ti.setQuantity(i.getQuantity() != null ? i.getQuantity() : 1);
                BigDecimal price = i.getOfferPrice() != null ? i.getOfferPrice()
                        : (i.getPrice() != null ? i.getPrice() : BigDecimal.ZERO);
                ti.setUnitPrice(price);
                return ti;
            }).toList();

            req.setItems(ticketItems);

            TicketResponse ticket = saleTicketService.create(req, order.getVendorUserId());

            String customer = order.getCustomerName() != null ? order.getCustomerName() : "cliente";
            notificationService.create(
                order.getVendorUserId(),
                "TICKET_CREATED",
                "Comprobante generado",
                "Comprobante " + ticket.getTicketNumber() + " generado automáticamente para el pedido de " + customer,
                ticket.getId()
            );

            log.info("Auto-generated ticket {} for confirmed order {}", ticket.getTicketNumber(), order.getId());

        } catch (Exception e) {
            log.error("Failed to auto-generate ticket for order {}: {}", order.getId(), e.getMessage(), e);
        }
    }
}
