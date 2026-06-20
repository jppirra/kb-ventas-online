# Mercado Pago Integration — Security & Production Audit Report
**Date:** 2026-06-20  
**Version:** v1.004.00  
**Reviewer:** Internal security audit (as external auditor perspective)  
**Branch:** feature/mercadopago

---

## Executive Summary

The Mercado Pago integration implements payments via Checkout Pro (preference-based), OAuth 2.0 account linking, and HMAC-signed webhooks. The overall security posture is **GOOD**. No hardcoded secrets were found. All sensitive credentials are encrypted at rest with AES-256-GCM. The main residual risks are operational (env var management, webhook secret rotation) rather than code-level vulnerabilities.

**Overall risk level: LOW** (with conditions listed in §4)

---

## 1. Token & Credential Security

### 1.1 Encryption at Rest (AES-256-GCM)
| Finding | Status |
|---------|--------|
| `mpAccessToken`, `mpRefreshToken`, `mpWebhookSecret` encrypted via `EncryptedStringConverter` | PASS |
| IV is random 12 bytes (SecureRandom) per encrypt call | PASS |
| AEAD tag (128-bit) provides tamper detection | PASS |
| `mpPublicKey` stored plaintext — correct, it's public by definition | PASS |
| Key loaded from `APP_ENCRYPTION_KEY` env var, not hardcoded | PASS |
| Blank key disables encryption with a warning log (dev convenience) | ACCEPTABLE — must never reach production without key |
| Invalid key (wrong length) fails fast at startup via `@PostConstruct` | PASS |

**Recommendation:** CI/CD pipeline should assert `APP_ENCRYPTION_KEY` is set and 64 hex chars before deploying to any non-dev environment.

### 1.2 Token Refresh
| Finding | Status |
|---------|--------|
| Pessimistic write lock (`findByIdForUpdate`) prevents concurrent refreshes | PASS |
| Double-check after lock (check-then-act pattern) | PASS |
| 5-minute refresh threshold prevents edge-case expiry during request | PASS |
| Refresh token stored encrypted; new tokens overwrite old via JPA (converter handles automatically) | PASS |

### 1.3 OAuth State Parameter (CSRF Prevention)
| Finding | Status |
|---------|--------|
| State is a JWT signed with existing `jwt.secret` | PASS |
| JWT contains `userId` + random `nonce` + `type:"mp-oauth"` | PASS |
| 5-minute expiry on state JWT | PASS |
| State validated in `connectAccount()` before code exchange | PASS |
| No state stored server-side (stateless) | PASS |

**Minor note:** The `nonce` in the state JWT provides CSRF protection but is not verified for uniqueness (no nonce store). This is acceptable because the JWT expiry (5 min) + the one-time nature of OAuth code exchange provides equivalent protection in practice.

---

## 2. Webhook Security

### 2.1 Signature Validation (HMAC-SHA256)
| Finding | Status |
|---------|--------|
| HMAC computed over `id:{data.id};request-id:{x-request-id};ts:{ts};` (MP standard format) | PASS |
| Timing-safe comparison via `MessageDigest.isEqual()` | PASS |
| Timestamp drift window: ±300 seconds | PASS |
| Invalid timestamp format raises `INVALID_TIMESTAMP` | PASS |
| Missing or blank `x-signature` header raises `MISSING_HEADER` | PASS |
| Signature failure returns 401 without logging request body | PASS — prevents secret body leakage in logs |
| No webhook secret → logs warning and skips HMAC (graceful for new accounts) | ACCEPTABLE — window closes once MP calls `registerWebhook()` |

### 2.2 Idempotency
| Finding | Status |
|---------|--------|
| `UNIQUE` constraint on `mp_webhook_events.external_id` | PASS |
| Duplicate INSERT caught as `DataIntegrityViolationException` → 200 silent | PASS |
| DB-level uniqueness — not application-level (race-condition proof) | PASS |

### 2.3 Async Processing (Fire & Forget)
| Finding | Status |
|---------|--------|
| Controller responds 200 before `processAsync()` starts | PASS — avoids MP 5s timeout |
| `@Async("asyncExecutor")` with bounded queue (50 tasks) | PASS |
| `MdcTaskDecorator` copies MDC/correlationId to async thread | PASS |
| `@Retryable` on `handlePaymentEvent` (3 attempts, 2s backoff × 2) | PASS |
| `@Recover` logs and marks event as `failed` on exhausted retries | PASS |

---

## 3. API Resilience

| Finding | Status |
|---------|--------|
| `@CircuitBreaker(name="mp-api")` on all `MercadoPagoApiClient` methods | PASS |
| `@Retry(name="mp-api")` on all `MercadoPagoApiClient` methods | PASS |
| Fallback methods throw `MercadoPagoUnavailableException` (not generic 500) | PASS |
| `RestClientResponseException` → `MercadoPagoApiException` with MP error code | PASS |
| Circuit breaker configured with sliding window, thresholds and half-open state | PASS |
| `GlobalExceptionHandler` maps MP exceptions to correct HTTP codes (503, 400, 424) | PASS |

---

## 4. Data Exposure Audit

### 4.1 DTO Layer — No Token Leakage
| Field | Exposed in DTO? |
|-------|----------------|
| `mpAccessToken` | NO — never included in any response DTO |
| `mpRefreshToken` | NO |
| `mpWebhookSecret` | NO |
| `mpPublicKey` | YES — `TicketConfigResponse`, correct (needed by frontend) |
| `mpEnabled`, `mpUserId`, `mpConnectedAt` | YES — `MercadoPagoConnectResponse`, correct |
| `mpPreferenceId`, `mpPaymentId`, `mpStatus` | YES — `TicketResponse`, correct |

**Result:** No sensitive data exposed via API responses.

### 4.2 Logs
| Finding | Status |
|---------|--------|
| Webhook body not logged on signature failure | PASS |
| `CryptoOperationException` logged at CRITICAL without exposing plaintext | PASS |
| CorrelationId in every request/async thread for traceability | PASS |
| MP error codes logged but not tokens | PASS |

### 4.3 Database
| Finding | Status |
|---------|--------|
| Tokens encrypted before persisting (`@Convert`) | PASS |
| Raw webhook body stored in `mp_webhook_events.raw_body` (plaintext) | ACCEPTED — needed for debugging; no PII beyond payment ID |
| All new nullable columns — no `ALTER TABLE ... NOT NULL` on existing rows | PASS |

---

## 5. Tenant Isolation

| Finding | Status |
|---------|--------|
| `userId` always extracted from JWT in controllers — never from request body | PASS |
| MP credentials scoped to `TicketConfig` by `userId` (PK) | PASS |
| Payment operations validate ticket ownership via `findByIdAndUserId()` | PASS |
| Webhook routes by `vendorUserId` embedded in the event | PASS |
| `mpPaymentLog` records `vendorUserId` for per-tenant audit trail | PASS |

---

## 6. DRAFT Ticket Stock Management

| Finding | Status |
|---------|--------|
| DRAFT tickets: no stock adjustment at creation | PASS |
| Stock adjusted exactly once: when webhook confirms `approved` → `confirmPayment()` | PASS |
| `confirmPayment()` is idempotent: if already `PAID`, returns without adjusting stock again | PASS |
| `delete()` only returns stock for `PAID` tickets (not DRAFT, not CANCELLED) | PASS |
| State machine (`TicketStatus`) enforces valid transitions; invalid throws 409 | PASS |

---

## 7. Production Readiness Checklist

### Security
- [ ] `APP_ENCRYPTION_KEY` set in production environment (64 hex chars)
- [ ] `MP_CLIENT_ID` and `MP_CLIENT_SECRET` set (production credentials, not sandbox)
- [ ] `MP_REDIRECT_URI` points to production domain
- [ ] `MP_NOTIFICATION_URL` publicly reachable (webhooks from MP)
- [ ] HTTPS enforced on all endpoints
- [ ] JWT secret is strong and rotated periodically

### Scalability
- [ ] `asyncExecutor` pool size tuned for production load (current: core=4, max=10, queue=50)
- [ ] Circuit breaker thresholds reviewed for expected MP API reliability
- [ ] `mp_webhook_events` table has index on `created_at` for cleanup jobs
- [ ] `mp_payment_log` table has index on `sale_ticket_id` for query performance

### Observability
- [ ] Actuator endpoints (`/actuator/health`, `/actuator/metrics`) secured or restricted
- [ ] Circuit breaker metrics exported to monitoring (Grafana / Datadog)
- [ ] `correlationId` in all log lines — confirm log aggregator indexes it
- [ ] Alert on `mp_webhook_events` with `status='failed'` older than 1 hour
- [ ] Alert on `CryptoOperationException` (indicates tampered data or key mismatch)

### Operational
- [ ] `mpTokenExpiresAt` monitoring: alert if tokens expire without a refresh
- [ ] Webhook secret rotation procedure documented
- [ ] Disaster recovery: procedure to re-link MP account without data loss
- [ ] GDPR/personal data: customer email in `sale_ticket` — retention policy in place

---

## 8. Known Limitations & Accepted Risks

| Item | Risk Level | Mitigation |
|------|-----------|-----------|
| No nonce uniqueness check in OAuth state JWT | LOW | 5-min expiry + one-time code exchange |
| Webhook body stored plaintext in DB | LOW | No PII beyond MP payment ID; can be encrypted later |
| Encryption disabled when `APP_ENCRYPTION_KEY` not set | MEDIUM | Fails visibly in logs; acceptable for dev only |
| Single MP account per vendor (1:1 with TicketConfig) | DESIGN | Current business requirement; multi-account requires schema change |
| Async queue bounded at 50 — burst of >50 simultaneous webhooks drops tasks | LOW | Webhooks are retried by MP; can increase queue size |

---

## 9. Conclusion

The implementation follows SOLID principles, uses Clean Architecture with clear layer separation (Controller → Service → ApiClient → Repository), and applies defense-in-depth for credential protection. No hardcoded secrets, no exposed tokens in DTOs, no SQL injection vectors (all JPA), and no XSS surface in this backend-only integration.

**Sign-off:** Implementation approved for production deployment pending the operational checklist items in §7.
