package com.jafpsoft.ventas.integration.mercadopago;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.exception.MercadoPagoApiException;
import com.jafpsoft.ventas.exception.MercadoPagoUnavailableException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MercadoPagoApiClient {

    @Qualifier("mercadoPagoRestClient")
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    // ── Crear preferencia de pago ─────────────────────────────────────────────

    @CircuitBreaker(name = "mp-api", fallbackMethod = "unavailableFallback")
    @Retry(name = "mp-api")
    public JsonNode createPreference(String accessToken, Map<String, Object> preferenceBody, String correlationId) {
        log.debug("Creating MP preference correlationId={}", correlationId);
        return post("/checkout/preferences", accessToken, preferenceBody);
    }

    // ── Consultar pago por ID ─────────────────────────────────────────────────

    @CircuitBreaker(name = "mp-api", fallbackMethod = "unavailableFallback")
    @Retry(name = "mp-api")
    public JsonNode getPayment(String accessToken, String paymentId) {
        log.debug("Getting MP payment id={}", paymentId);
        return get("/v1/payments/" + paymentId, accessToken);
    }

    // ── Reembolsar pago ───────────────────────────────────────────────────────

    @CircuitBreaker(name = "mp-api", fallbackMethod = "unavailableFallback")
    public JsonNode refundPayment(String accessToken, String paymentId) {
        log.debug("Refunding MP payment id={}", paymentId);
        return post("/v1/payments/" + paymentId + "/refunds", accessToken, Map.of());
    }

    // ── Fallback del Circuit Breaker ──────────────────────────────────────────

    @SuppressWarnings("unused")
    public JsonNode unavailableFallback(String accessToken, Map<String, Object> body, String correlationId, Exception ex) {
        log.warn("MP circuit breaker OPEN for createPreference: {}", ex.getMessage());
        throw new MercadoPagoUnavailableException("Mercado Pago no disponible (circuit breaker abierto)", ex);
    }

    @SuppressWarnings("unused")
    public JsonNode unavailableFallback(String accessToken, String paymentId, Exception ex) {
        log.warn("MP circuit breaker OPEN for getPayment {}: {}", paymentId, ex.getMessage());
        throw new MercadoPagoUnavailableException("Mercado Pago no disponible (circuit breaker abierto)", ex);
    }

    @SuppressWarnings("unused")
    public JsonNode unavailableFallback(String accessToken, Exception ex) {
        log.warn("MP circuit breaker OPEN for refundPayment: {}", ex.getMessage());
        throw new MercadoPagoUnavailableException("Mercado Pago no disponible (circuit breaker abierto)", ex);
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    private JsonNode post(String uri, String accessToken, Object body) {
        try {
            String response = restClient.post()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return parseJson(response);
        } catch (RestClientResponseException e) {
            throw toMpApiException(e);
        } catch (ResourceAccessException e) {
            throw new MercadoPagoUnavailableException("Timeout conectando con Mercado Pago", e);
        }
    }

    private JsonNode get(String uri, String accessToken) {
        try {
            String response = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(String.class);
            return parseJson(response);
        } catch (RestClientResponseException e) {
            throw toMpApiException(e);
        } catch (ResourceAccessException e) {
            throw new MercadoPagoUnavailableException("Timeout conectando con Mercado Pago", e);
        }
    }

    private MercadoPagoApiException toMpApiException(RestClientResponseException e) {
        String mpErrorCode = null;
        try {
            JsonNode node = objectMapper.readTree(e.getResponseBodyAsString());
            mpErrorCode = node.path("error").asText(null);
        } catch (Exception ignored) {}
        return new MercadoPagoApiException(e.getStatusCode().value(),
                "MP API error " + e.getStatusCode().value() + ": " + e.getMessage(), mpErrorCode);
    }

    private JsonNode parseJson(String response) {
        try {
            return objectMapper.readTree(response);
        } catch (Exception e) {
            throw new MercadoPagoUnavailableException("Respuesta inválida de Mercado Pago", e);
        }
    }
}
