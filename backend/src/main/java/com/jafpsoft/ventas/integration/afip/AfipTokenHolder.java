package com.jafpsoft.ventas.integration.afip;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/** Contiene el Token y Sign devueltos por el WSAA. TTL: 12 horas. */
@Getter
@Builder
public class AfipTokenHolder {
    private final String token;
    private final String sign;
    private final Instant expiresAt;

    /** El token se considera válido con 5 minutos de margen */
    public boolean isValid() {
        return expiresAt != null && Instant.now().isBefore(expiresAt.minusSeconds(300));
    }
}
