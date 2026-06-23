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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class SaleTicketService {

    private final SaleTicketRepository ticketRepository;
    private final TicketConfigRepository configRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

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
        String tipoDoc = req.getTipoDoc() != null ? req.getTipoDoc() : "COMP";
        String tipoLetra = config.getTipoComprobante() != null ? config.getTipoComprobante() : "B";

        int ticketNum;
        if ("NC".equals(tipoDoc)) {
            ticketNum = config.getNextNcNumber() != null ? config.getNextNcNumber() : 1;
            config.setNextNcNumber(ticketNum + 1);
        } else if ("ND".equals(tipoDoc)) {
            ticketNum = config.getNextNdNumber() != null ? config.getNextNdNumber() : 1;
            config.setNextNdNumber(ticketNum + 1);
        } else {
            ticketNum = config.getNextTicketNumber();
            config.setNextTicketNumber(ticketNum + 1);
        }
        configRepository.save(config);

        String prefix;
        if ("NC".equals(tipoDoc)) {
            prefix = "NC " + tipoLetra;
        } else if ("ND".equals(tipoDoc)) {
            prefix = "ND " + tipoLetra;
        } else {
            prefix = tipoLetra;
        }
        String ticketNumber = config.getPuntoVenta() != null
                ? String.format("%s %04d-%08d", prefix, config.getPuntoVenta(), ticketNum)
                : ("NC".equals(tipoDoc) || "ND".equals(tipoDoc))
                    ? String.format("%s-%04d", tipoDoc, ticketNum)
                    : String.format("T-%04d", ticketNum);

        boolean isDraft = Boolean.TRUE.equals(req.getDraft());
        SaleTicket ticket = SaleTicket.builder()
                .userId(userId)
                .ticketNumber(ticketNumber)
                .tipoDoc(tipoDoc)
                .referenceTicketNumber(req.getReferenceTicketNumber())
                .customerName(req.getCustomerName())
                .customerDni(req.getCustomerDni())
                .customerPhone(req.getCustomerPhone())
                .customerEmail(req.getCustomerEmail())
                .customerNotes(req.getCustomerNotes())
                .paymentMethod(req.getPaymentMethod())
                .discount(req.getDiscount() != null ? req.getDiscount() : BigDecimal.ZERO)
                .notes(req.getNotes())
                .status(isDraft ? "DRAFT" : "PAID")
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
        // DRAFT: no ajustar stock hasta que el pago sea confirmado vía webhook
        // NC: devuelve stock; ND y COMP: descuentan stock
        if (!isDraft) {
            adjustStock(saved.getItems(), "NC".equals(tipoDoc) ? 1 : -1, userId);
        }
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
    public TicketResponse cancel(Long id, Long userId, String reason) {
        SaleTicket ticket = findOwned(id, userId);
        if ("CANCELLED".equals(ticket.getStatus())) return TicketResponse.from(ticket);
        ticket.setStatus("CANCELLED");
        ticket.setCancellationReason(reason != null ? reason.trim() : null);
        SaleTicket saved = ticketRepository.save(ticket);
        adjustStock(saved.getItems(), 1, userId);
        return TicketResponse.from(saved);
    }

    @Transactional
    public TicketResponse updateCustomer(Long id, Long userId, Map<String, String> data) {
        SaleTicket ticket = findOwned(id, userId);
        if (data.containsKey("customerName"))  ticket.setCustomerName(data.get("customerName"));
        if (data.containsKey("customerDni"))   ticket.setCustomerDni(data.get("customerDni"));
        if (data.containsKey("customerPhone")) ticket.setCustomerPhone(data.get("customerPhone"));
        if (data.containsKey("customerEmail")) ticket.setCustomerEmail(data.get("customerEmail"));
        if (data.containsKey("customerNotes")) ticket.setCustomerNotes(data.get("customerNotes"));
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        SaleTicket ticket = findOwned(id, userId);
        // Solo devolver stock si el ticket descontó stock (no aplica a DRAFT ni CANCELLED)
        String status = ticket.getStatus();
        if ("PAID".equals(status)) {
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
        config.setBankAccounts(req.getBankAccounts());
        if (req.getFooter() != null) config.setFooter(req.getFooter());
        if (req.getShowCatalogQr() != null) config.setShowCatalogQr(req.getShowCatalogQr());
        if (req.getTipoComprobante() != null) config.setTipoComprobante(req.getTipoComprobante());
        config.setPuntoVenta(req.getPuntoVenta());
        if (req.getCondicionIva() != null) config.setCondicionIva(req.getCondicionIva());
        if (req.getIngresosBrutos() != null) config.setIngresosBrutos(req.getIngresosBrutos());
        if (req.getInicioActividades() != null) config.setInicioActividades(req.getInicioActividades());
        return TicketConfigResponse.from(configRepository.save(config));
    }

    // ── Confirmar pago local (transferencia / tarjeta / otro) ────────────────

    @Transactional
    public TicketResponse confirmLocalPayment(Long id, Long userId, String reference, String proofUrl) {
        SaleTicket ticket = findOwned(id, userId);
        if (!"DRAFT".equals(ticket.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "El ticket ya fue procesado (estado: " + ticket.getStatus() + ")");
        }
        ticket.setStatus("PAID");
        if (reference != null && !reference.isBlank()) ticket.setPaymentReference(reference);
        if (proofUrl != null && !proofUrl.isBlank()) ticket.setPaymentProofUrl(proofUrl);
        adjustStock(ticket.getItems(), "NC".equals(ticket.getTipoDoc()) ? 1 : -1, userId);
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── Email ─────────────────────────────────────────────────────────────────

    public void sendTicketEmail(Long id, Long userId) {
        SaleTicket ticket = findOwned(id, userId);
        if (ticket.getCustomerEmail() == null || ticket.getCustomerEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comprobante no tiene email de comprador");
        }
        TicketConfig config = configRepository.findById(userId)
                .orElse(TicketConfig.builder().userId(userId).build());
        String biz = config.getBusinessName() != null ? config.getBusinessName() : "Tu negocio";
        String cur = config.getCurrency() != null ? config.getCurrency() : "$";
        String subject = "Comprobante de tu compra - " + biz;
        String body = buildEmailHtml(ticket, biz, cur, config.getFooter());
        emailService.sendAdminEmail(ticket.getCustomerEmail(), subject, body);
    }

    private String buildEmailHtml(SaleTicket ticket, String biz, String cur, String footer) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String fecha = ticket.getCreatedAt() != null ? ticket.getCreatedAt().format(fmt) : "";
        StringBuilder rows = new StringBuilder();
        for (SaleTicketItem it : ticket.getItems()) {
            double sub = it.getUnitPrice().doubleValue() * it.getQuantity();
            rows.append(String.format(
                "<tr><td style='padding:8px 0;border-bottom:1px solid #f3f4f6;'>%s%s</td>" +
                "<td style='padding:8px 0;text-align:center;border-bottom:1px solid #f3f4f6;'>%d</td>" +
                "<td style='padding:8px 0;text-align:right;border-bottom:1px solid #f3f4f6;'>%s%.2f</td>" +
                "<td style='padding:8px 0;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:600;'>%s%.2f</td></tr>",
                it.getProductName(), it.getSize() != null ? " (" + it.getSize() + ")" : "",
                it.getQuantity(), cur, it.getUnitPrice().doubleValue(), cur, sub));
        }
        double disc = ticket.getDiscount() != null ? ticket.getDiscount().doubleValue() : 0;
        String discRow = disc > 0 ? String.format("<tr><td colspan='3' style='padding:6px 0;text-align:right;color:#6b7280;'>Descuento</td><td style='padding:6px 0;text-align:right;color:#6b7280;'>-%s%.2f</td></tr>", cur, disc) : "";
        String footerHtml = (footer != null && !footer.isBlank()) ? "<p style='color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;'>" + footer + "</p>" : "";
        return "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;'>" +
            "<div style='max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);'>" +
            "<div style='background:#1d4ed8;padding:24px 32px;'>" +
            "<p style='color:#bfdbfe;font-size:13px;margin:0 0 4px;'>" + biz + "</p>" +
            "<h1 style='color:#fff;font-size:20px;margin:0;'>Comprobante de compra</h1></div>" +
            "<div style='padding:24px 32px;'>" +
            "<div style='display:flex;justify-content:space-between;margin-bottom:16px;font-size:14px;color:#6b7280;'>" +
            "<span><b style='color:#111827;font-family:monospace;'>" + ticket.getTicketNumber() + "</b></span>" +
            "<span>" + fecha + "</span></div>" +
            (ticket.getCustomerName() != null ? "<p style='font-size:14px;color:#374151;margin:0 0 16px;'>Para: <b>" + ticket.getCustomerName() + "</b></p>" : "") +
            "<table width='100%' cellpadding='0' cellspacing='0' style='font-size:14px;'>" +
            "<thead><tr style='font-size:12px;color:#9ca3af;'><th align='left' style='padding-bottom:8px;border-bottom:1px solid #e5e7eb;'>Producto</th>" +
            "<th style='padding-bottom:8px;border-bottom:1px solid #e5e7eb;'>Cant.</th>" +
            "<th align='right' style='padding-bottom:8px;border-bottom:1px solid #e5e7eb;'>Precio</th>" +
            "<th align='right' style='padding-bottom:8px;border-bottom:1px solid #e5e7eb;'>Subtotal</th></tr></thead>" +
            "<tbody>" + rows + "</tbody>" +
            "<tfoot>" + discRow +
            "<tr><td colspan='3' style='padding-top:12px;text-align:right;font-weight:600;color:#111827;'>Total</td>" +
            "<td style='padding-top:12px;text-align:right;font-weight:700;font-size:18px;color:#1d4ed8;'>" + cur + String.format("%.2f", ticket.getTotal().doubleValue()) + "</td></tr>" +
            (ticket.getPaymentMethod() != null ? "<tr><td colspan='4' style='padding-top:8px;font-size:12px;color:#6b7280;'>Forma de pago: " + ticket.getPaymentMethod() + "</td></tr>" : "") +
            "</tfoot></table>" +
            footerHtml + "</div></div></body></html>";
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
