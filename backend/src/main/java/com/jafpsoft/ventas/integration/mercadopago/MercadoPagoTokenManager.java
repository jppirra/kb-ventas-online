package com.jafpsoft.ventas.integration.mercadopago;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.exception.MercadoPagoTokenException;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class MercadoPagoTokenManager {

    private final TicketConfigRepository configRepository;
    private final ObjectMapper objectMapper;

    @Qualifier("mercadoPagoRestClient")
    private final RestClient restClient;

    @Value("${mp.client-id:}")
    private String clientId;

    @Value("${mp.client-secret:}")
    private String clientSecret;

    private static final int REFRESH_THRESHOLD_MINUTES = 5;

    @Transactional
    public String getValidToken(Long userId) {
        TicketConfig config = configRepository.findById(userId)
                .orElseThrow(() -> new MercadoPagoTokenException("TicketConfig no encontrado para userId=" + userId));

        if (!config.isMpEnabled() || config.getMpAccessToken() == null) {
            throw new MercadoPagoTokenException("Mercado Pago no está conectado para este vendedor");
        }

        if (isTokenValid(config)) {
            return config.getMpAccessToken();
        }

        return refreshTokenLocked(userId);
    }

    @Transactional
    public String exchangeAuthorizationCode(String code, String redirectUri) {
        String maskedSecret = clientSecret != null && clientSecret.length() > 12
                ? clientSecret.substring(0, 12) + "..." : "(vacío)";
        log.info("MP OAuth exchange — client_id=[{}] secret_prefix=[{}] redirect=[{}]",
                clientId, maskedSecret, redirectUri);
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("grant_type", "authorization_code");
            body.add("code", code);
            body.add("redirect_uri", redirectUri);

            String response = restClient.post()
                    .uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            return response;
        } catch (Exception e) {
            log.error("Failed to exchange authorization code: {}", e.getMessage());
            throw new MercadoPagoTokenException("Error al conectar con Mercado Pago", e);
        }
    }

    private boolean isTokenValid(TicketConfig config) {
        if (config.getMpTokenExpiresAt() == null) return true;
        return config.getMpTokenExpiresAt().isAfter(LocalDateTime.now().plusMinutes(REFRESH_THRESHOLD_MINUTES));
    }

    private String refreshTokenLocked(Long userId) {
        TicketConfig config = configRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new MercadoPagoTokenException("TicketConfig no encontrado"));

        if (isTokenValid(config)) {
            return config.getMpAccessToken();
        }

        if (config.getMpRefreshToken() == null) {
            throw new MercadoPagoTokenException("Refresh token no disponible — reconectá Mercado Pago");
        }

        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("grant_type", "refresh_token");
            body.add("refresh_token", config.getMpRefreshToken());

            String response = restClient.post()
                    .uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode node = objectMapper.readTree(response);
            String newAccessToken = node.path("access_token").asText();
            String newRefreshToken = node.path("refresh_token").asText(config.getMpRefreshToken());
            long expiresIn = node.path("expires_in").asLong(21600);

            config.setMpAccessToken(newAccessToken);
            config.setMpRefreshToken(newRefreshToken);
            config.setMpTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
            configRepository.save(config);

            log.info("MP token refreshed for userId={}", userId);
            return newAccessToken;
        } catch (MercadoPagoTokenException e) {
            throw e;
        } catch (Exception e) {
            log.error("MP token refresh failed for userId={}: {}", userId, e.getMessage());
            throw new MercadoPagoTokenException("Error al renovar el token de Mercado Pago", e);
        }
    }
}
