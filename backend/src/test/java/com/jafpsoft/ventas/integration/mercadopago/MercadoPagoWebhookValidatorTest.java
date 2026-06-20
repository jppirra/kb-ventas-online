package com.jafpsoft.ventas.integration.mercadopago;

import com.jafpsoft.ventas.exception.WebhookSignatureException;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookValidatorTest {

    @Mock
    private TicketConfigRepository configRepository;

    @InjectMocks
    private MercadoPagoWebhookValidator validator;

    private static final String WEBHOOK_SECRET = "super_secret_webhook_key";
    private static final Long VENDOR_ID = 1L;
    private static final String DATA_ID = "987654321";
    private static final String REQUEST_ID = "uuid-request-id";

    @BeforeEach
    void setUp() {
        TicketConfig config = new TicketConfig();
        config.setUserId(VENDOR_ID);
        config.setMpWebhookSecret(WEBHOOK_SECRET);
        when(configRepository.findById(VENDOR_ID)).thenReturn(Optional.of(config));
    }

    @Test
    void validate_validSignature_doesNotThrow() {
        long ts = Instant.now().getEpochSecond();
        String xSignature = buildSignature(DATA_ID, REQUEST_ID, ts, WEBHOOK_SECRET);

        assertDoesNotThrow(() -> validator.validate(DATA_ID, REQUEST_ID, xSignature, VENDOR_ID));
    }

    @Test
    void validate_missingHeader_throwsMissingHeader() {
        WebhookSignatureException ex = assertThrows(WebhookSignatureException.class,
                () -> validator.validate(DATA_ID, REQUEST_ID, null, VENDOR_ID));
        assertEquals("MISSING_HEADER", ex.getReason());
    }

    @Test
    void validate_blankHeader_throwsMissingHeader() {
        WebhookSignatureException ex = assertThrows(WebhookSignatureException.class,
                () -> validator.validate(DATA_ID, REQUEST_ID, "   ", VENDOR_ID));
        assertEquals("MISSING_HEADER", ex.getReason());
    }

    @Test
    void validate_invalidFormat_missingV1_throwsInvalidFormat() {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        WebhookSignatureException ex = assertThrows(WebhookSignatureException.class,
                () -> validator.validate(DATA_ID, REQUEST_ID, "ts=" + ts, VENDOR_ID));
        assertEquals("INVALID_FORMAT", ex.getReason());
    }

    @Test
    void validate_expiredTimestamp_throwsTimestampExpired() {
        long expiredTs = Instant.now().getEpochSecond() - 400; // 400s > 300s drift
        String xSignature = buildSignature(DATA_ID, REQUEST_ID, expiredTs, WEBHOOK_SECRET);

        WebhookSignatureException ex = assertThrows(WebhookSignatureException.class,
                () -> validator.validate(DATA_ID, REQUEST_ID, xSignature, VENDOR_ID));
        assertEquals("TIMESTAMP_EXPIRED", ex.getReason());
    }

    @Test
    void validate_futureTimestampBeyondDrift_throwsTimestampExpired() {
        long futureTs = Instant.now().getEpochSecond() + 400;
        String xSignature = buildSignature(DATA_ID, REQUEST_ID, futureTs, WEBHOOK_SECRET);

        WebhookSignatureException ex = assertThrows(WebhookSignatureException.class,
                () -> validator.validate(DATA_ID, REQUEST_ID, xSignature, VENDOR_ID));
        assertEquals("TIMESTAMP_EXPIRED", ex.getReason());
    }

    @Test
    void validate_wrongHmac_throwsHmacMismatch() {
        long ts = Instant.now().getEpochSecond();
        String xSignature = "ts=" + ts + ",v1=deadbeef00000000000000000000000000000000000000000000000000000000";

        WebhookSignatureException ex = assertThrows(WebhookSignatureException.class,
                () -> validator.validate(DATA_ID, REQUEST_ID, xSignature, VENDOR_ID));
        assertEquals("HMAC_MISMATCH", ex.getReason());
    }

    @Test
    void validate_noWebhookSecretConfigured_doesNotThrow() {
        TicketConfig configNoSecret = new TicketConfig();
        configNoSecret.setUserId(VENDOR_ID);
        configNoSecret.setMpWebhookSecret(null);
        when(configRepository.findById(VENDOR_ID)).thenReturn(Optional.of(configNoSecret));

        long ts = Instant.now().getEpochSecond();
        // Firma irrelevante cuando no hay secret
        assertDoesNotThrow(() -> validator.validate(DATA_ID, REQUEST_ID,
                "ts=" + ts + ",v1=anycontent", VENDOR_ID));
    }

    @Test
    void validate_invalidTimestampFormat_throwsInvalidTimestamp() {
        String xSignature = "ts=not_a_number,v1=deadbeef";
        WebhookSignatureException ex = assertThrows(WebhookSignatureException.class,
                () -> validator.validate(DATA_ID, REQUEST_ID, xSignature, VENDOR_ID));
        assertEquals("INVALID_TIMESTAMP", ex.getReason());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private static String buildSignature(String dataId, String requestId, long ts, String secret) {
        String message = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
        String hmac = computeHmac(message, secret);
        return "ts=" + ts + ",v1=" + hmac;
    }

    private static String computeHmac(String message, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
