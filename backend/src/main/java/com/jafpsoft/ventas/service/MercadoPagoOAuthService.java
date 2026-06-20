package com.jafpsoft.ventas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.dto.payment.MercadoPagoConnectRequest;
import com.jafpsoft.ventas.dto.payment.MercadoPagoConnectResponse;
import com.jafpsoft.ventas.exception.MercadoPagoTokenException;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoTokenManager;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MercadoPagoOAuthService {

    private final TicketConfigRepository configRepository;
    private final MercadoPagoTokenManager tokenManager;
    private final ObjectMapper objectMapper;

    @Qualifier("mercadoPagoRestClient")
    private final RestClient restClient;

    @Value("${mp.client-id:}")
    private String clientId;

    @Value("${mp.client-secret:}")
    private String clientSecret;

    @Value("${mp.redirect-uri:http://localhost:5173/tickets/config}")
    private String redirectUri;

    @Value("${mp.notification-url:http://localhost:8080}")
    private String notificationUrl;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private static final long STATE_EXPIRATION_MS = 5 * 60 * 1000L; // 5 min

    // ── Construye la URL de autorización de MP ────────────────────────────────

    public Map<String, String> buildAuthorizationUrl(Long userId) {
        String state = buildOAuthStateJwt(userId);
        String url = UriComponentsBuilder
                .fromHttpUrl("https://auth.mercadopago.com/authorization")
                .queryParam("client_id", clientId)
                .queryParam("response_type", "code")
                .queryParam("platform_id", "mp")
                .queryParam("state", state)
                .queryParam("redirect_uri", redirectUri)
                .build().toUriString();
        return Map.of("authUrl", url);
    }

    // ── Conecta la cuenta MP tras el callback de OAuth ────────────────────────

    @Transactional
    public MercadoPagoConnectResponse connectAccount(Long userId, MercadoPagoConnectRequest req) {
        validateOAuthState(userId, req.getState());

        String tokenResponse = tokenManager.exchangeAuthorizationCode(req.getCode(), redirectUri);

        TicketConfig config = configRepository.findById(userId)
                .orElse(TicketConfig.builder().userId(userId).build());

        applyTokensToConfig(config, tokenResponse);

        // Registrar webhook en MP para recibir notificaciones de pago
        registerWebhook(config);

        configRepository.save(config);
        log.info("MP account connected for userId={} mpUserId={}", userId, config.getMpUserId());
        return MercadoPagoConnectResponse.from(config);
    }

    // ── Desconecta la cuenta MP ───────────────────────────────────────────────

    @Transactional
    public void disconnectAccount(Long userId) {
        TicketConfig config = configRepository.findById(userId).orElse(null);
        if (config == null || !config.isMpEnabled()) return;

        // Intentar eliminar el webhook en MP (ignorar errores — es best-effort)
        if (config.getMpWebhookId() != null && config.getMpAccessToken() != null) {
            try {
                restClient.delete()
                        .uri("/v1/webhooks/{id}", config.getMpWebhookId())
                        .header("Authorization", "Bearer " + config.getMpAccessToken())
                        .retrieve()
                        .toBodilessEntity();
            } catch (Exception e) {
                log.warn("Could not delete MP webhook {}: {}", config.getMpWebhookId(), e.getMessage());
            }
        }

        clearMpFields(config);
        configRepository.save(config);
        log.info("MP account disconnected for userId={}", userId);
    }

    // ── Status ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MercadoPagoConnectResponse getStatus(Long userId) {
        return configRepository.findById(userId)
                .map(MercadoPagoConnectResponse::from)
                .orElse(MercadoPagoConnectResponse.disconnected());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String buildOAuthStateJwt(Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("nonce", UUID.randomUUID().toString());
        claims.put("type", "mp-oauth");
        return Jwts.builder()
                .claims(claims)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + STATE_EXPIRATION_MS))
                .signWith(getSigningKey())
                .compact();
    }

    private void validateOAuthState(Long userId, String state) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(state)
                    .getPayload();

            Object claimUserId = claims.get("userId");
            Long stateUserId = claimUserId instanceof Integer ? ((Integer) claimUserId).longValue() : (Long) claimUserId;

            if (!userId.equals(stateUserId)) {
                throw new MercadoPagoTokenException("OAuth state userId mismatch — posible CSRF");
            }
            if (!"mp-oauth".equals(claims.get("type"))) {
                throw new MercadoPagoTokenException("OAuth state type inválido");
            }
        } catch (MercadoPagoTokenException e) {
            throw e;
        } catch (Exception e) {
            throw new MercadoPagoTokenException("OAuth state inválido o expirado", e);
        }
    }

    private void applyTokensToConfig(TicketConfig config, String tokenResponseJson) {
        try {
            JsonNode node = objectMapper.readTree(tokenResponseJson);
            config.setMpAccessToken(node.path("access_token").asText());
            config.setMpRefreshToken(node.path("refresh_token").asText());
            config.setMpPublicKey(node.path("public_key").asText());
            config.setMpUserId(node.path("user_id").asLong());
            config.setMpScope(node.path("scope").asText());
            long expiresIn = node.path("expires_in").asLong(21600);
            config.setMpTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
            config.setMpConnectedAt(LocalDateTime.now());
            config.setMpEnabled(true);
        } catch (Exception e) {
            throw new MercadoPagoTokenException("Error al procesar respuesta de tokens MP", e);
        }
    }

    private void registerWebhook(TicketConfig config) {
        try {
            String webhookUrl = notificationUrl + "/api/webhooks/mercadopago?userId=" + config.getUserId();
            String response = restClient.post()
                    .uri("/v1/webhooks")
                    .header("Authorization", "Bearer " + config.getMpAccessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "url", webhookUrl,
                            "events", new String[]{"payment"},
                            "notifications_enabled", true
                    ))
                    .retrieve()
                    .body(String.class);

            JsonNode node = objectMapper.readTree(response);
            config.setMpWebhookId(node.path("id").asText(null));
            String secret = node.path("secret").asText(null);
            if (secret != null) config.setMpWebhookSecret(secret);
        } catch (Exception e) {
            log.warn("Could not register MP webhook (non-fatal): {}", e.getMessage());
        }
    }

    private void clearMpFields(TicketConfig config) {
        config.setMpEnabled(false);
        config.setMpAccessToken(null);
        config.setMpRefreshToken(null);
        config.setMpWebhookSecret(null);
        config.setMpPublicKey(null);
        config.setMpUserId(null);
        config.setMpScope(null);
        config.setMpWebhookId(null);
        config.setMpConnectedAt(null);
        config.setMpTokenExpiresAt(null);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
}
