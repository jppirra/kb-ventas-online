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
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Map;

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

    // Renueva el token si expira en menos de 5 minutos
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

        // Token expirado o por expirar — refrescar con lock pesimista
        return refreshTokenLocked(userId);
    }

    @Transactional
    public String exchangeAuthorizationCode(String code, String redirectUri) {
        try {
            String response = restClient.post()
                    .uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "client_id", clientId,
                            "client_secret", clientSecret,
                            "grant_type", "authorization_code",
                            "code", code,
                            "redirect_uri", redirectUri
                    ))
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
        // Adquirir lock pesimista para evitar refresh concurrente
        TicketConfig config = configRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new MercadoPagoTokenException("TicketConfig no encontrado"));

        // Re-verificar después del lock — otro thread pudo haber refrescado ya
        if (isTokenValid(config)) {
            return config.getMpAccessToken();
        }

        if (config.getMpRefreshToken() == null) {
            throw new MercadoPagoTokenException("Refresh token no disponible — reconectá Mercado Pago");
        }

        try {
            String response = restClient.post()
                    .uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "client_id", clientId,
                            "client_secret", clientSecret,
                            "grant_type", "refresh_token",
                            "refresh_token", config.getMpRefreshToken()
                    ))
                    .retrieve()
                    .body(String.class);

            JsonNode node = objectMapper.readTree(response);
            String newAccessToken = node.path("access_token").asText();
            String newRefreshToken = node.path("refresh_token").asText(config.getMpRefreshToken());
            long expiresIn = node.path("expires_in").asLong(21600);

            // JPA @Convert cifra automáticamente al guardar
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
