package com.jafpsoft.ventas.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.exception.WebhookSignatureException;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoWebhookProcessor;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoWebhookValidator;
import com.jafpsoft.ventas.model.MercadoPagoWebhookEvent;
import com.jafpsoft.ventas.repository.MercadoPagoWebhookEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final MercadoPagoWebhookValidator validator;
    private final MercadoPagoWebhookProcessor processor;
    private final MercadoPagoWebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;

    /**
     * Endpoint receptor de webhooks de Mercado Pago.
     * Seguridad: NO requiere JWT — está en permitAll.
     * Protocolo: validar firma → responder 200 inmediatamente → procesar async.
     */
    @PostMapping("/mercadopago")
    public ResponseEntity<Map<String, String>> receiveMercadoPago(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestBody String rawBody,
            @RequestHeader(value = "x-signature", required = false) String xSignature,
            @RequestHeader(value = "x-request-id", required = false) String requestId) {

        String correlationId = MDC.get("correlationId");

        JsonNode body;
        try {
            body = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            log.warn("[WEBHOOK] Invalid JSON body correlationId={}", correlationId);
            return ResponseEntity.badRequest().body(Map.of("error", "invalid body"));
        }

        String topic = body.path("type").asText(body.path("topic").asText("unknown"));
        String dataId = body.path("data").path("id").asText(null);

        if (dataId == null) {
            log.warn("[WEBHOOK] Missing data.id topic={} correlationId={}", topic, correlationId);
            return ResponseEntity.ok(Map.of("status", "ignored"));
        }

        // Validar firma HMAC (401 sin loguear el body en caso de fallo)
        try {
            validator.validate(dataId, requestId != null ? requestId : "", xSignature, userId);
        } catch (WebhookSignatureException e) {
            log.warn("[WEBHOOK REJECTED] reason={} correlationId={}", e.getReason(), correlationId);
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        String externalId = topic + ":" + dataId;
        log.info("[WEBHOOK RECEIVED] topic={} externalId={} userId={} correlationId={}",
                topic, externalId, userId, correlationId);

        // Idempotencia: INSERT único por external_id — duplicado → 200 silencioso
        MercadoPagoWebhookEvent event;
        try {
            event = webhookEventRepository.save(MercadoPagoWebhookEvent.builder()
                    .externalId(externalId)
                    .topic(topic)
                    .vendorUserId(userId)
                    .status("received")
                    .correlationId(correlationId)
                    .build());
        } catch (DataIntegrityViolationException e) {
            log.info("[WEBHOOK DUPLICATE] externalId={} — silently ignored", externalId);
            return ResponseEntity.ok(Map.of("status", "duplicate"));
        }

        // Responder 200 ANTES de procesar (MP espera máx 5 segundos)
        // El procesamiento es async y puede tardar más
        processor.processAsync(event.getId(), topic, dataId, userId, correlationId);

        return ResponseEntity.ok(Map.of("status", "received"));
    }
}
