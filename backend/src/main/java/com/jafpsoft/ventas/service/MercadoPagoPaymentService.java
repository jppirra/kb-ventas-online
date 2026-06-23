package com.jafpsoft.ventas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.jafpsoft.ventas.dto.payment.MercadoPagoPaymentStatusResponse;
import com.jafpsoft.ventas.dto.payment.MercadoPagoPreferenceResponse;
import com.jafpsoft.ventas.dto.ticket.TicketResponse;
import com.jafpsoft.ventas.exception.IllegalTicketStateTransitionException;
import com.jafpsoft.ventas.exception.MercadoPagoTokenException;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoApiClient;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoTokenManager;
import com.jafpsoft.ventas.model.MercadoPagoPaymentLog;
import com.jafpsoft.ventas.model.SaleTicket;
import com.jafpsoft.ventas.model.SaleTicketItem;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.model.enums.TicketStatus;
import com.jafpsoft.ventas.repository.MercadoPagoPaymentLogRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.SaleTicketRepository;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MercadoPagoPaymentService {

    private final SaleTicketRepository ticketRepository;
    private final TicketConfigRepository configRepository;
    private final ProductRepository productRepository;
    private final MercadoPagoPaymentLogRepository paymentLogRepository;
    private final MercadoPagoApiClient apiClient;
    private final MercadoPagoTokenManager tokenManager;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final com.jafpsoft.ventas.repository.UserRepository userRepository;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Value("${mp.notification-url:http://localhost:8080}")
    private String mpNotificationUrl;

    // ── Crear preferencia de pago en MP ──────────────────────────────────────

    @Transactional
    public MercadoPagoPreferenceResponse createPreference(Long ticketId, Long userId, String correlationId) {
        SaleTicket ticket = findOwned(ticketId, userId);

        TicketStatus current = TicketStatus.fromString(ticket.getStatus());

        // Idempotencia: si ya tiene preferencia activa la reutilizamos
        if (current == TicketStatus.PAYMENT_PENDING && ticket.getMpPreferenceId() != null) {
            log.info("Ticket {} ya en PAYMENT_PENDING con preferencia {}, reutilizando", ticketId, ticket.getMpPreferenceId());
            String prefId = ticket.getMpPreferenceId();
            return MercadoPagoPreferenceResponse.builder()
                    .preferenceId(prefId)
                    .initPoint("https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=" + prefId)
                    .sandboxInitPoint("https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=" + prefId)
                    .build();
        }

        current.assertCanTransitionTo(TicketStatus.PAYMENT_PENDING);

        TicketConfig config = configRepository.findById(userId)
                .orElseThrow(() -> new MercadoPagoTokenException("Mercado Pago no está configurado"));

        if (!config.isMpEnabled()) {
            throw new MercadoPagoTokenException("Mercado Pago no está conectado para este vendedor");
        }

        String token = tokenManager.getValidToken(userId);

        Map<String, Object> preferenceBody = buildPreferenceBody(ticket, config, userId, correlationId);
        JsonNode response = apiClient.createPreference(token, preferenceBody, correlationId);

        String preferenceId = response.path("id").asText();
        String initPoint = response.path("init_point").asText();
        String sandboxInitPoint = response.path("sandbox_init_point").asText();

        String oldStatus = ticket.getStatus();
        ticket.setMpPreferenceId(preferenceId);
        ticket.setStatus(TicketStatus.PAYMENT_PENDING.name());
        ticketRepository.save(ticket);

        logPayment(ticketId, userId, null, "PREFERENCE_CREATED", oldStatus, TicketStatus.PAYMENT_PENDING.name(), correlationId);

        log.info("MP preference created ticketId={} preferenceId={} correlationId={}", ticketId, preferenceId, correlationId);
        return MercadoPagoPreferenceResponse.builder()
                .preferenceId(preferenceId)
                .initPoint(initPoint)
                .sandboxInitPoint(sandboxInitPoint)
                .build();
    }

    // ── Consultar estado del pago (con sincronización opcional desde MP) ──────

    @Transactional(readOnly = true)
    public MercadoPagoPaymentStatusResponse getPaymentStatus(Long ticketId, Long userId) {
        SaleTicket ticket = findOwned(ticketId, userId);
        return MercadoPagoPaymentStatusResponse.builder()
                .ticketStatus(ticket.getStatus())
                .mpStatus(ticket.getMpStatus())
                .mpStatusDetail(ticket.getMpStatusDetail())
                .mpPaymentId(ticket.getMpPaymentId())
                .mpPreferenceId(ticket.getMpPreferenceId())
                .build();
    }

    // ── Confirmar pago (llamado desde webhook processor) ──────────────────────

    @Transactional
    public void confirmPayment(Long ticketId, String mpPaymentId, String mpStatus,
                               LocalDateTime paidAt, String correlationId) {
        SaleTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket " + ticketId + " no encontrado"));

        TicketStatus current = TicketStatus.fromString(ticket.getStatus());

        // Idempotencia a nivel de negocio: si ya está PAID no procesar de nuevo
        if (current == TicketStatus.PAID) {
            log.info("Ticket {} ya está PAID — webhook duplicado ignorado", ticketId);
            return;
        }

        try {
            current.assertCanTransitionTo(TicketStatus.PAID);
        } catch (IllegalTicketStateTransitionException e) {
            log.warn("Cannot confirm payment for ticket {} in status {}: {}", ticketId, current, e.getMessage());
            return;
        }

        String oldStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.PAID.name());
        ticket.setMpPaymentId(mpPaymentId);
        ticket.setMpStatus(mpStatus);
        ticket.setMpPaidAt(paidAt != null ? paidAt : LocalDateTime.now());
        ticketRepository.save(ticket);

        // Descontar stock (mismo patrón que SaleTicketService.adjustStock)
        adjustStock(ticket.getItems(), -1, ticket.getUserId());

        logPayment(ticketId, ticket.getUserId(), mpPaymentId, "PAYMENT_APPROVED", oldStatus, TicketStatus.PAID.name(), correlationId);

        TicketConfig config = configRepository.findById(ticket.getUserId())
                .orElse(TicketConfig.builder().userId(ticket.getUserId()).build());

        // Enviar email de confirmación al comprador (async, non-blocking)
        if (ticket.getCustomerEmail() != null && !ticket.getCustomerEmail().isBlank()) {
            emailService.sendPaymentConfirmationEmail(ticket, config);
        }

        // Notificar al vendedor por email
        userRepository.findById(ticket.getUserId()).ifPresent(vendor ->
                emailService.sendPaymentReceivedVendorEmail(ticket, config, vendor.getEmail()));


        String customerLabel = ticket.getCustomerName() != null ? ticket.getCustomerName() : "un cliente";
        String cur = config.getCurrency() != null ? config.getCurrency() : "$";
        notificationService.create(
                ticket.getUserId(),
                "PAYMENT_RECEIVED",
                "Pago recibido",
                String.format("Pago de %s confirmado — %s %s", customerLabel, ticket.getTicketNumber(), cur + ticket.getTotal().toPlainString()),
                ticketId
        );

        log.info("Payment confirmed ticketId={} mpPaymentId={} correlationId={}", ticketId, mpPaymentId, correlationId);
    }

    // ── Marcar pago fallido (llamado desde webhook processor) ─────────────────

    @Transactional
    public void failPayment(Long ticketId, String mpPaymentId, String mpStatus,
                            String statusDetail, String correlationId) {
        SaleTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket " + ticketId + " no encontrado"));

        TicketStatus current = TicketStatus.fromString(ticket.getStatus());
        if (current == TicketStatus.PAYMENT_FAILED || current == TicketStatus.CANCELLED) {
            return;
        }

        try {
            current.assertCanTransitionTo(TicketStatus.PAYMENT_FAILED);
        } catch (IllegalTicketStateTransitionException e) {
            log.warn("Cannot fail payment for ticket {} in status {}", ticketId, current);
            return;
        }

        String oldStatus = ticket.getStatus();
        ticket.setStatus(TicketStatus.PAYMENT_FAILED.name());
        ticket.setMpPaymentId(mpPaymentId);
        ticket.setMpStatus(mpStatus);
        ticket.setMpStatusDetail(statusDetail);
        ticketRepository.save(ticket);

        logPayment(ticketId, ticket.getUserId(), mpPaymentId, "PAYMENT_FAILED", oldStatus, TicketStatus.PAYMENT_FAILED.name(), correlationId);
        log.info("Payment failed ticketId={} mpPaymentId={} reason={}", ticketId, mpPaymentId, statusDetail);
    }

    // ── Reintentar pago: PAYMENT_FAILED → DRAFT ───────────────────────────────

    @Transactional
    public TicketResponse resetPaymentAttempt(Long ticketId, Long userId) {
        SaleTicket ticket = findOwned(ticketId, userId);

        TicketStatus current = TicketStatus.fromString(ticket.getStatus());
        current.assertCanTransitionTo(TicketStatus.DRAFT);

        ticket.setStatus(TicketStatus.DRAFT.name());
        ticket.setMpPreferenceId(null);
        ticket.setMpPaymentId(null);
        ticket.setMpStatus(null);
        ticket.setMpStatusDetail(null);
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── QR de venta presencial ────────────────────────────────────────────────

    public MercadoPagoPreferenceResponse generateQrPreference(
            Long userId, BigDecimal amount, String description, String correlationId) {

        TicketConfig config = configRepository.findById(userId)
            .orElseThrow(() -> new MercadoPagoTokenException("Mercado Pago no está configurado para este vendedor"));

        if (!config.isMpEnabled()) {
            throw new MercadoPagoTokenException("Mercado Pago no está conectado para este vendedor");
        }

        String token = tokenManager.getValidToken(userId);
        String safeDesc = (description != null && !description.isBlank()) ? description : "Venta presencial";

        Map<String, Object> body = new HashMap<>();
        body.put("items", List.of(Map.of(
            "title", safeDesc,
            "quantity", 1,
            "unit_price", amount.doubleValue(),
            "currency_id", "ARS"
        )));
        body.put("external_reference", "qr:" + UUID.randomUUID());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("correlationId", correlationId);
        metadata.put("userId", userId);
        metadata.put("type", "QR_PRESENTIAL");
        body.put("metadata", metadata);

        JsonNode response = apiClient.createPreference(token, body, correlationId);

        log.info("QR preference created userId={} amount={} desc='{}' correlationId={}",
            userId, amount, safeDesc, correlationId);

        return MercadoPagoPreferenceResponse.builder()
            .preferenceId(response.path("id").asText())
            .initPoint(response.path("init_point").asText())
            .sandboxInitPoint(response.path("sandbox_init_point").asText())
            .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> buildPreferenceBody(SaleTicket ticket, TicketConfig config,
                                                    Long userId, String correlationId) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (SaleTicketItem item : ticket.getItems()) {
            Map<String, Object> mpItem = new HashMap<>();
            mpItem.put("title", item.getProductName());
            mpItem.put("quantity", item.getQuantity());
            mpItem.put("unit_price", item.getUnitPrice().doubleValue());
            mpItem.put("currency_id", "ARS");
            items.add(mpItem);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("items", items);
        body.put("external_reference", "ticket:" + ticket.getId());

        Map<String, String> backUrls = new HashMap<>();
        backUrls.put("success", baseUrl + "/tickets/" + ticket.getId() + "?mp=success");
        backUrls.put("failure", baseUrl + "/tickets/" + ticket.getId() + "?mp=failure");
        backUrls.put("pending", baseUrl + "/tickets/" + ticket.getId() + "?mp=pending");
        body.put("back_urls", backUrls);
        body.put("auto_return", "approved");

        // notification_url solo si apunta a un host accesible (no localhost)
        if (!mpNotificationUrl.contains("localhost")) {
            body.put("notification_url", mpNotificationUrl + "/api/webhooks/mercadopago");
        }

        log.info("MP preference body — baseUrl=[{}] notifUrl=[{}] backSuccess=[{}]",
                baseUrl, mpNotificationUrl, backUrls.get("success"));

        if (ticket.getCustomerName() != null || ticket.getCustomerEmail() != null) {
            Map<String, String> payer = new HashMap<>();
            if (ticket.getCustomerName() != null) {
                String[] parts = ticket.getCustomerName().trim().split(" ", 2);
                payer.put("first_name", parts[0]);
                if (parts.length > 1) payer.put("last_name", parts[1]);
            }
            if (ticket.getCustomerEmail() != null) payer.put("email", ticket.getCustomerEmail());
            body.put("payer", payer);
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("correlationId", correlationId);
        metadata.put("userId", userId);
        body.put("metadata", metadata);

        if (ticket.getDiscount() != null && ticket.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            body.put("marketplace_fee", 0);
        }

        return body;
    }

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

    private void logPayment(Long ticketId, Long userId, String mpPaymentId,
                            String eventType, String oldStatus, String newStatus, String correlationId) {
        try {
            paymentLogRepository.save(MercadoPagoPaymentLog.builder()
                    .saleTicketId(ticketId)
                    .vendorUserId(userId)
                    .mpPaymentId(mpPaymentId)
                    .eventType(eventType)
                    .oldStatus(oldStatus)
                    .newStatus(newStatus)
                    .correlationId(correlationId)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to write payment log: {}", e.getMessage());
        }
    }

    private SaleTicket findOwned(Long id, Long userId) {
        return ticketRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket no encontrado"));
    }
}
