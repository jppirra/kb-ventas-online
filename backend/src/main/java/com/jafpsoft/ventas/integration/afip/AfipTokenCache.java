package com.jafpsoft.ventas.integration.afip;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache en memoria para los tokens WSAA (Token+Sign).
 * Cada entrada es por userId (CUIT del vendedor).
 * TTL gestionado por AfipTokenHolder.isValid().
 */
@Slf4j
@Component
public class AfipTokenCache {

    private final ConcurrentHashMap<Long, AfipTokenHolder> cache = new ConcurrentHashMap<>();

    public Optional<AfipTokenHolder> get(Long userId) {
        AfipTokenHolder holder = cache.get(userId);
        if (holder != null && holder.isValid()) {
            return Optional.of(holder);
        }
        if (holder != null) {
            cache.remove(userId);
            log.debug("AFIP token expirado para userId={}", userId);
        }
        return Optional.empty();
    }

    public void put(Long userId, AfipTokenHolder holder) {
        cache.put(userId, holder);
        log.info("AFIP token cacheado para userId={} expira={}", userId, holder.getExpiresAt());
    }

    public void evict(Long userId) {
        cache.remove(userId);
    }
}
