package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.ticket.*;
import com.jafpsoft.ventas.model.SaleTicket;
import com.jafpsoft.ventas.model.SaleTicketItem;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.SaleTicketRepository;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class SaleTicketService {

    private final SaleTicketRepository ticketRepository;
    private final TicketConfigRepository configRepository;
    private final ProductRepository productRepository;

    // ── Tickets ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TicketResponse> listByUser(Long userId) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(TicketResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getById(Long id, Long userId) {
        return TicketResponse.from(findOwned(id, userId));
    }

    @Transactional
    public TicketResponse create(TicketRequest req, Long userId) {
        // Lock the row so concurrent requests can't take the same number.
        // If no config exists yet, create one inside the transaction before anyone else can.
        TicketConfig config = configRepository.findByIdForUpdate(userId)
                .orElseGet(() -> configRepository.save(TicketConfig.builder().userId(userId).build()));
        int ticketNum = config.getNextTicketNumber();
        config.setNextTicketNumber(ticketNum + 1);
        configRepository.save(config);

        String tipoDoc = req.getTipoDoc() != null ? req.getTipoDoc() : "COMP";
        String prefix;
        if ("NC".equals(tipoDoc)) {
            prefix = config.getPuntoVenta() != null ? "NC" : "NC";
        } else if ("ND".equals(tipoDoc)) {
            prefix = config.getPuntoVenta() != null ? "ND" : "ND";
        } else {
            prefix = config.getTipoComprobante() != null ? config.getTipoComprobante() : "B";
        }
        String ticketNumber = config.getPuntoVenta() != null
                ? String.format("%s %04d-%08d", prefix, config.getPuntoVenta(), ticketNum)
                : ("NC".equals(tipoDoc) || "ND".equals(tipoDoc))
                    ? String.format("%s-%04d", tipoDoc, ticketNum)
                    : String.format("T-%04d", ticketNum);

        SaleTicket ticket = SaleTicket.builder()
                .userId(userId)
                .ticketNumber(ticketNumber)
                .tipoDoc(tipoDoc)
                .referenceTicketNumber(req.getReferenceTicketNumber())
                .customerName(req.getCustomerName())
                .customerPhone(req.getCustomerPhone())
                .customerEmail(req.getCustomerEmail())
                .customerNotes(req.getCustomerNotes())
                .paymentMethod(req.getPaymentMethod())
                .discount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO)
                .notes(req.getNotes())
                .status("PAID")
                .build();

        AtomicInteger order = new AtomicInteger(0);
        List<SaleTicketItem> items = req.getItems().stream().map(r -> {
            BigDecimal unit = r.getUnitPrice() != null ? r.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal sub = unit.multiply(BigDecimal.valueOf(r.getQuantity()));
            return SaleTicketItem.builder()
                    .ticket(ticket)
                    .productId(r.getProductId())
                    .productName(r.getProductName())
                    .productSku(r.getProductSku())
                    .size(r.getSize())
                    .color(r.getColor())
                    .quantity(r.getQuantity())
                    .unitPrice(unit)
                    .subtotal(sub)
                    .sortOrder(order.getAndIncrement())
                    .build();
        }).toList();

        ticket.getItems().addAll(items);

        BigDecimal subtotal = items.stream()
                .map(SaleTicketItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discount = ticket.getDiscount();
        ticket.setSubtotal(subtotal);
        ticket.setTotal(subtotal.subtract(discount).max(BigDecimal.ZERO));

        SaleTicket saved = ticketRepository.save(ticket);
        // NC devuelve stock; ND y COMP descuentan stock
        adjustStock(saved.getItems(), "NC".equals(tipoDoc) ? 1 : -1, userId);
        return TicketResponse.from(saved);
    }

    @Transactional
    public TicketResponse updateStatus(Long id, Long userId, String status) {
        SaleTicket ticket = findOwned(id, userId);
        String oldStatus = ticket.getStatus();
        ticket.setStatus(status);
        SaleTicket saved = ticketRepository.save(ticket);
        if ("CANCELLED".equals(status) && !"CANCELLED".equals(oldStatus)) {
            adjustStock(saved.getItems(), 1, userId);
        } else if (!"CANCELLED".equals(status) && "CANCELLED".equals(oldStatus)) {
            adjustStock(saved.getItems(), -1, userId);
        }
        return TicketResponse.from(saved);
    }

    @Transactional
    public TicketResponse updateCustomer(Long id, Long userId, Map<String, String> data) {
        SaleTicket ticket = findOwned(id, userId);
        if (data.containsKey("customerName"))  ticket.setCustomerName(data.get("customerName"));
        if (data.containsKey("customerPhone")) ticket.setCustomerPhone(data.get("customerPhone"));
        if (data.containsKey("customerEmail")) ticket.setCustomerEmail(data.get("customerEmail"));
        if (data.containsKey("customerNotes")) ticket.setCustomerNotes(data.get("customerNotes"));
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        SaleTicket ticket = findOwned(id, userId);
        if (!"CANCELLED".equals(ticket.getStatus())) {
            adjustStock(ticket.getItems(), 1, userId);
        }
        ticketRepository.delete(ticket);
    }

    // ── TicketConfig ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TicketConfigResponse getConfig(Long userId) {
        TicketConfig config = configRepository.findById(userId)
                .orElse(TicketConfig.builder().userId(userId).build());
        return TicketConfigResponse.from(config);
    }

    @Transactional
    public TicketConfigResponse saveConfig(Long userId, TicketConfigRequest req) {
        TicketConfig config = configRepository.findById(userId)
                .orElse(TicketConfig.builder().userId(userId).build());
        if (req.getBusinessName() != null) config.setBusinessName(req.getBusinessName());
        if (req.getBusinessAddress() != null) config.setBusinessAddress(req.getBusinessAddress());
        if (req.getBusinessPhone() != null) config.setBusinessPhone(req.getBusinessPhone());
        if (req.getBusinessEmail() != null) config.setBusinessEmail(req.getBusinessEmail());
        if (req.getTaxId() != null) config.setTaxId(req.getTaxId());
        if (req.getLogoUrl() != null) config.setLogoUrl(req.getLogoUrl());
        if (req.getCurrency() != null) config.setCurrency(req.getCurrency());
        if (req.getPaymentMethods() != null) config.setPaymentMethods(req.getPaymentMethods());
        if (req.getFooter() != null) config.setFooter(req.getFooter());
        if (req.getShowCatalogQr() != null) config.setShowCatalogQr(req.getShowCatalogQr());
        if (req.getTipoComprobante() != null) config.setTipoComprobante(req.getTipoComprobante());
        config.setPuntoVenta(req.getPuntoVenta());
        if (req.getCondicionIva() != null) config.setCondicionIva(req.getCondicionIva());
        if (req.getIngresosBrutos() != null) config.setIngresosBrutos(req.getIngresosBrutos());
        if (req.getInicioActividades() != null) config.setInicioActividades(req.getInicioActividades());
        return TicketConfigResponse.from(configRepository.save(config));
    }

    // ── Stock ─────────────────────────────────────────────────────────────────

    private void adjustStock(List<SaleTicketItem> items, int delta, Long userId) {
        for (SaleTicketItem item : items) {
            if (item.getProductId() == null) continue;
            productRepository.findByIdAndUserId(item.getProductId(), userId).ifPresent(product -> {
                if (product.isShowStockQuantity() && product.getStockCount() != null) {
                    product.setStockCount(product.getStockCount() + delta * item.getQuantity());
                    productRepository.save(product);
                }
            });
        }
    }

    private SaleTicket findOwned(Long id, Long userId) {
        return ticketRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket no encontrado"));
    }
}
