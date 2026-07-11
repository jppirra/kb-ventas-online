package com.jafpsoft.ventas.integration.mercadopago;

import com.jafpsoft.ventas.exception.WebhookSignatureException;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

@Slf4j
@Component
@RequiredArgsConstructor
public class MercadoPagoWebhookValidator {

    private final TicketConfigRepository configRepository;

    private static final long MAX_TIMESTAMP_DRIFT_SECONDS = 300; // 5 minutos

    /**
     * Valida la firma HMAC-SHA256 del webhook de Mercado Pago.
     * Formato del header x-signature: "ts=TIMESTAMP,v1=HMAC_HEX"
     * Mensaje firmado por MP: "id:{data.id};request-id:{x-request-id};ts:{ts};"
     */
    public void validate(String dataId, String requestId, String xSignature, Long vendorUserId) {
        if (xSignature == null || xSignature.isBlank()) {
            throw new WebhookSignatureException("MISSING_HEADER");
        }

        String[] parts = xSignature.split(",");
        String ts = null;
        String v1 = null;

        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.startsWith("ts=")) ts = trimmed.substring(3);
            if (trimmed.startsWith("v1=")) v1 = trimmed.substring(3);
        }

        if (ts == null || v1 == null) {
            throw new WebhookSignatureException("INVALID_FORMAT");
        }

        validateTimestamp(ts);

        String webhookSecret = getWebhookSecret(vendorUserId);
        if (webhookSecret == null) {
            // Sin secret configurado — saltar validación de firma (webhook no registrado aún)
            log.warn("No webhook secret for userId={} — skipping HMAC validation", vendorUserId);
            return;
        }

        String message = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
        String computed = computeHmac(message, webhookSecret);

        // Comparación timing-safe para prevenir timing attacks
        if (!MessageDigest.isEqual(computed.getBytes(StandardCharsets.UTF_8),
                v1.getBytes(StandardCharsets.UTF_8))) {
            throw new WebhookSignatureException("HMAC_MISMATCH");
        }
    }

    private void validateTimestamp(String ts) {
        try {
            long webhookTs = Long.parseLong(ts);
            long now = Instant.now().getEpochSecond();
            if (Math.abs(now - webhookTs) > MAX_TIMESTAMP_DRIFT_SECONDS) {
                throw new WebhookSignatureException("TIMESTAMP_EXPIRED");
            }
        } catch (NumberFormatException e) {
            throw new WebhookSignatureException("INVALID_TIMESTAMP");
        }
    }

    private String getWebhookSecret(Long vendorUserId) {
        return configRepository.findById(vendorUserId)
                .map(TicketConfig::getMpWebhookSecret)
                .orElse(null);
    }

    private String computeHmac(String message, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new WebhookSignatureException("HMAC_COMPUTE_ERROR");
        }
    }
}
