package com.jafpsoft.ventas.integration.mercadopago;

import com.fasterxml.jackson.databind.JsonNode;
import com.jafpsoft.ventas.exception.MercadoPagoUnavailableException;
import com.jafpsoft.ventas.model.enums.TicketStatus;
import com.jafpsoft.ventas.repository.MercadoPagoWebhookEventRepository;
import com.jafpsoft.ventas.service.MercadoPagoPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class MercadoPagoWebhookProcessor {

    private final MercadoPagoPaymentService paymentService;
    private final MercadoPagoApiClient apiClient;
    private final MercadoPagoTokenManager tokenManager;
    private final MercadoPagoWebhookEventRepository webhookEventRepository;

    /**
     * Procesa el webhook de forma asíncrona. Se llama desde el controller DESPUÉS de responder 200.
     * El decorador @Async propaga el MDC (correlationId) al thread hijo via MdcTaskDecorator.
     */
    @Async("asyncExecutor")
    @Transactional
    public void processAsync(Long webhookEventId, String topic, String mpObjectId,
                             Long vendorUserId, String correlationId) {
        log.info("[WEBHOOK PROCESSING] eventId={} topic={} objectId={} userId={} correlationId={}",
                webhookEventId, topic, mpObjectId, vendorUserId, correlationId);

        webhookEventRepository.updateStatus(webhookEventId, "processing", null);

        try {
            if ("payment".equals(topic)) {
                handlePaymentEvent(mpObjectId, vendorUserId, correlationId);
            } else {
                log.info("[WEBHOOK IGNORED] topic={} not handled", topic);
                webhookEventRepository.updateStatus(webhookEventId, "ignored", null);
                return;
            }
            webhookEventRepository.markProcessed(webhookEventId, LocalDateTime.now());
        } catch (Exception e) {
            log.error("[WEBHOOK FAILED] eventId={} error={}", webhookEventId, e.getMessage(), e);
            webhookEventRepository.updateStatus(webhookEventId, "failed",
                    e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 500)) : "Unknown error");
        }
    }

    @Retryable(
            retryFor = MercadoPagoUnavailableException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2.0)
    )
    private void handlePaymentEvent(String mpPaymentId, Long vendorUserId, String correlationId) {
        String token = tokenManager.getValidToken(vendorUserId);

        // Siempre consultar MP para el estado real — no confiar en el body del webhook
        JsonNode payment = apiClient.getPayment(token, mpPaymentId);

        String mpStatus = payment.path("status").asText();
        String mpStatusDetail = payment.path("status_detail").asText();
        String externalReference = payment.path("external_reference").asText();

        Long ticketId = parseTicketId(externalReference);
        if (ticketId == null) {
            log.warn("[WEBHOOK] Cannot parse ticketId from external_reference='{}' paymentId={}",
                    externalReference, mpPaymentId);
            return;
        }

        String paidAtStr = payment.path("date_approved").asText(null);
        LocalDateTime paidAt = paidAtStr != null && !paidAtStr.isBlank()
                ? LocalDateTime.parse(paidAtStr.replace("Z", "").replace("+00:00", "").substring(0, 19))
                : null;

        log.info("[WEBHOOK] payment={} ticketId={} mpStatus={} correlationId={}",
                mpPaymentId, ticketId, mpStatus, correlationId);

        switch (mpStatus) {
            case "approved" ->
                paymentService.confirmPayment(ticketId, mpPaymentId, mpStatus, paidAt, correlationId);
            case "rejected", "cancelled" ->
                paymentService.failPayment(ticketId, mpPaymentId, mpStatus, mpStatusDetail, correlationId);
            case "pending", "in_process", "authorized" -> {
                // Actualizar a PAYMENT_PROCESSING si corresponde (sin cambiar stock)
                log.info("[WEBHOOK] payment {} is {} — no action needed yet", mpPaymentId, mpStatus);
            }
            default ->
                log.warn("[WEBHOOK] Unknown MP status '{}' for payment {}", mpStatus, mpPaymentId);
        }
    }

    @Recover
    private void recoverPaymentEvent(MercadoPagoUnavailableException e, String mpPaymentId,
                                     Long vendorUserId, String correlationId) {
        log.error("[WEBHOOK RETRY EXHAUSTED] mpPaymentId={} vendorUserId={} correlationId={}: {}",
                mpPaymentId, vendorUserId, correlationId, e.getMessage());
        throw e;
    }

    private Long parseTicketId(String externalReference) {
        if (externalReference == null || !externalReference.startsWith("ticket:")) return null;
        try {
            return Long.parseLong(externalReference.substring(7));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
