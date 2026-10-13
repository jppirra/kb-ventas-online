package com.jafpsoft.ventas.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwsHeader;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.LocatorAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * Verifica el ID token que entrega Google Sign-In: firma con las claves públicas de Google,
 * emisor, destinatario (el client id de esta aplicación), vencimiento y correo verificado.
 */
@Slf4j
@Component
public class GoogleTokenVerifier {

    private static final String JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");
    private static final long CLOCK_SKEW_SECONDS = 60;
    private static final long MIN_REFRESH_INTERVAL_MS = 60_000;

    private final String clientId;
    private final Function<String, PublicKey> keyLookup;

    private final ObjectMapper objectMapper;
    private volatile Map<String, PublicKey> googleKeys = Map.of();
    private volatile long lastRefresh = 0;

    @Autowired
    public GoogleTokenVerifier(@Value("${google.client-id:}") String clientId, ObjectMapper objectMapper) {
        this.clientId = clientId;
        this.objectMapper = objectMapper;
        this.keyLookup = this::findGoogleKey;
    }

    // Para tests: permite verificar contra una clave propia sin salir a internet
    public GoogleTokenVerifier(String clientId, Function<String, PublicKey> keyLookup) {
        this.clientId = clientId;
        this.objectMapper = null;
        this.keyLookup = keyLookup;
    }

    public Claims verify(String credential) {
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalArgumentException("El ingreso con Google no está habilitado.");
        }
        if (credential == null || credential.isBlank()) {
            throw new IllegalArgumentException("Token de Google inválido.");
        }

        Claims claims;
        try {
            claims = Jwts.parser()
                    .keyLocator(new LocatorAdapter<Key>() {
                        @Override
                        protected Key locate(JwsHeader header) {
                            return keyLookup.apply(header.getKeyId());
                        }
                    })
                    .clockSkewSeconds(CLOCK_SKEW_SECONDS)
                    .build()
                    .parseSignedClaims(credential)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Google token rejected: {}", e.getMessage());
            throw new IllegalArgumentException("Token de Google inválido.");
        }

        if (claims.getIssuer() == null || !ISSUERS.contains(claims.getIssuer())) {
            log.warn("Google token rejected: unexpected issuer");
            throw new IllegalArgumentException("Token de Google inválido.");
        }
        if (claims.getAudience() == null || !claims.getAudience().contains(clientId)) {
            log.warn("Google token rejected: issued for another application");
            throw new IllegalArgumentException("Token de Google inválido.");
        }
        if (claims.getExpiration() == null) {
            log.warn("Google token rejected: no expiration");
            throw new IllegalArgumentException("Token de Google inválido.");
        }
        Object emailVerified = claims.get("email_verified");
        if (!Boolean.TRUE.equals(emailVerified) && !"true".equals(emailVerified)) {
            throw new IllegalArgumentException("El correo de la cuenta de Google no está verificado.");
        }
        return claims;
    }

    // ── Claves públicas de Google (rotan: se recargan cuando aparece un kid desconocido) ──

    private PublicKey findGoogleKey(String kid) {
        if (kid == null) return null;
        PublicKey key = googleKeys.get(kid);
        if (key == null) {
            refreshGoogleKeys();
            key = googleKeys.get(kid);
        }
        return key;
    }

    private synchronized void refreshGoogleKeys() {
        long now = System.currentTimeMillis();
        if (now - lastRefresh < MIN_REFRESH_INTERVAL_MS) return;
        lastRefresh = now;
        try {
            String body = RestClient.create().get().uri(JWKS_URL).retrieve().body(String.class);
            Map<String, PublicKey> loaded = parseJwks(objectMapper.readTree(body));
            if (!loaded.isEmpty()) googleKeys = loaded;
        } catch (Exception e) {
            log.error("Could not load Google public keys: {}", e.getMessage());
        }
    }

    // Convierte el documento JWKS ({"keys":[{kty,kid,n,e},...]}) en claves públicas por kid
    public static Map<String, PublicKey> parseJwks(JsonNode jwks) throws GeneralSecurityException {
        Map<String, PublicKey> loaded = new HashMap<>();
        KeyFactory factory = KeyFactory.getInstance("RSA");
        for (JsonNode k : jwks.path("keys")) {
            if (!"RSA".equals(k.path("kty").asText())) continue;
            BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(k.path("n").asText()));
            BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(k.path("e").asText()));
            loaded.put(k.path("kid").asText(), factory.generatePublic(new RSAPublicKeySpec(modulus, exponent)));
        }
        return Map.copyOf(loaded);
    }
}
