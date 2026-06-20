# Arquitectura de Integración — Mercado Pago
> Staff Architect Design · Branch: `feature/mercadopago` · Target: v1.004.00 · 2026-06-20  
> Basado en: `docs/mercadopago-analysis.md` y `docs/system-map.md`

---

## Índice

1. [Visión General](#1-visión-general)
2. [Modelo de Persistencia](#2-modelo-de-persistencia)
3. [Cifrado AES-256-GCM](#3-cifrado-aes-256-gcm)
4. [Máquina de Estados del Ticket](#4-máquina-de-estados-del-ticket)
5. [OAuth Flow — Conexión de Cuenta MP](#5-oauth-flow--conexión-de-cuenta-mp)
6. [Payments — Creación de Preferencias y Consulta](#6-payments--creación-de-preferencias-y-consulta)
7. [Circuit Breaker — Resiliencia contra fallos de MP](#7-circuit-breaker--resiliencia-contra-fallos-de-mp)
8. [Webhooks — Idempotencia y Procesamiento Seguro](#8-webhooks--idempotencia-y-procesamiento-seguro)
9. [Observabilidad — Logging, Métricas y Correlation-ID](#9-observabilidad--logging-métricas-y-correlation-id)
10. [Arquitectura de Packages](#10-arquitectura-de-packages)
11. [Firmas de Métodos y Excepciones](#11-firmas-de-métodos-y-excepciones)
12. [Diagrama de Componentes Completo](#12-diagrama-de-componentes-completo)
13. [Matriz de Decisiones](#13-matriz-de-decisiones)

---

## 1. Visión General

### Modelo de integración adoptado

Cada vendedor conecta su **propia cuenta de Mercado Pago** vía OAuth 2.0. Los pagos van directo a la cuenta del vendedor. La plataforma no intermedia el dinero (sin Marketplace). Esto simplifica la integración y la responsabilidad fiscal.

```mermaid
graph TD
    Vendedor["Vendedor (Usuario)"]
    Comprador["Comprador (Cliente final)"]
    Plataforma["KB Ventas Online\n(Spring Boot + React)"]
    MP["Mercado Pago API\napi.mercadopago.com"]
    MPCheckout["MP Checkout Pro\n(Hosted page de MP)"]
    Webhook["Webhook IPN\n/api/webhooks/mercadopago"]
    MPDB[("BD: ticket_configs\n(access_token CIFRADO)")]

    Vendedor -- "Conecta su cuenta MP (OAuth)" --> Plataforma
    Plataforma -- "Guarda access_token AES-256" --> MPDB
    Vendedor -- "Crea ticket de venta" --> Plataforma
    Plataforma -- "createPreference(access_token)" --> MP
    MP -- "Retorna init_point URL" --> Plataforma
    Plataforma -- "Muestra link de pago" --> Comprador
    Comprador -- "Paga" --> MPCheckout
    MPCheckout -- "Procesa pago" --> MP
    MP -- "Notifica" --> Webhook
    Webhook -- "Confirma ticket PAID" --> Plataforma
    Plataforma -- "Email de confirmación" --> Comprador
```

### Capas de la integración

```mermaid
graph LR
    subgraph Controller ["Controller Layer"]
        WC["WebhookController"]
        STC["SaleTicketController\n(endpoints /payment/*)"]
        TCC["TicketConfigController\n(endpoints /mercadopago)"]
    end

    subgraph Application ["Application/Service Layer"]
        MPS["MercadoPagoPaymentService"]
        MPOA["MercadoPagoOAuthService"]
        STS["SaleTicketService"]
    end

    subgraph Infrastructure ["Infrastructure Layer (integration/)"]
        MPAC["MercadoPagoApiClient\n(Circuit Breaker)"]
        WV["WebhookValidator\n(HMAC-SHA256)"]
        TM["TokenManager\n(Refresh automático)"]
        ESC["EncryptedStringConverter\n(AES-256-GCM)"]
    end

    subgraph Persistence ["Persistence Layer"]
        TC[("ticket_configs\n+mp_access_token ENCRYPTED")]
        ST[("sale_tickets\n+mp_preference_id\n+mp_payment_id\n+mp_status")]
        WE[("mp_webhook_events\nIDEMPOTENCIA")]
        PL[("mp_payment_log\nAUDITORÍA")]
    end

    subgraph External ["External Systems"]
        MPAPI["api.mercadopago.com"]
        EmailSvc["EmailService\n(Resend)"]
    end

    Controller --> Application
    Application --> Infrastructure
    Application --> Persistence
    Infrastructure --> External
    Infrastructure --> Persistence
    ESC --> TC
```

---

## 2. Modelo de Persistencia

### 2.1 Extensión de `TicketConfig` — Credenciales MP por Tenant

Todos los campos sensibles usan `@Convert(converter = EncryptedStringConverter.class)`. Los campos no sensibles van en plain text.

```mermaid
erDiagram
    ticket_configs {
        BIGINT user_id PK
        VARCHAR business_name
        VARCHAR currency
        INTEGER next_ticket_number
        VARCHAR tipo_comprobante
        TEXT mp_access_token "ENCRYPTED AES-256"
        TEXT mp_refresh_token "ENCRYPTED AES-256"
        BIGINT mp_user_id "plain — ID del vendedor en MP"
        VARCHAR mp_public_key "plain — va al frontend"
        BOOLEAN mp_enabled "default false"
        TEXT mp_webhook_secret "ENCRYPTED AES-256"
        TIMESTAMP mp_token_expires_at "para detectar expiración"
        VARCHAR mp_scope "scopes concedidos por el vendedor"
        TIMESTAMP mp_connected_at "cuándo se conectó"
        TIMESTAMP updated_at
    }

    sale_tickets {
        BIGINT id PK
        BIGINT user_id
        VARCHAR ticket_number
        VARCHAR status "DRAFT|PAYMENT_PENDING|PAYMENT_PROCESSING|PAID|PAYMENT_FAILED|CANCELLED"
        NUMERIC total
        VARCHAR payment_method
        VARCHAR mp_preference_id "ID de preferencia creada en MP"
        VARCHAR mp_payment_id "ID del pago confirmado por MP"
        VARCHAR mp_status "pending|approved|rejected|cancelled|refunded"
        VARCHAR mp_status_detail "detalle de rechazo de MP"
        TIMESTAMP mp_paid_at "momento exacto de aprobación"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    mp_webhook_events {
        BIGINT id PK
        VARCHAR external_id UK "payment:123456789 — idempotency key"
        VARCHAR topic "payment|merchant_order|chargebacks"
        BIGINT vendor_user_id "FK a users — para tenant"
        VARCHAR status "received|processing|processed|failed|ignored"
        TEXT raw_body "body original para debugging"
        VARCHAR correlation_id "para trazabilidad"
        TEXT error_message "si falló"
        TIMESTAMP processed_at
        TIMESTAMP created_at
    }

    mp_payment_log {
        BIGINT id PK
        BIGINT sale_ticket_id FK
        BIGINT vendor_user_id
        VARCHAR mp_payment_id
        VARCHAR event_type "preference_created|payment_received|refund_requested|refund_completed"
        VARCHAR old_status
        VARCHAR new_status
        TEXT metadata "JSON con datos adicionales de MP"
        VARCHAR correlation_id
        TIMESTAMP created_at
    }

    users ||--o| ticket_configs : "1:1 (user_id = PK)"
    users ||--o{ sale_tickets : "user_id"
    sale_tickets ||--o{ mp_payment_log : "sale_ticket_id"
    users ||--o{ mp_webhook_events : "vendor_user_id"
```

### 2.2 Justificación del modelo de tablas

| Tabla | Por qué existe | Alternativa descartada |
|-------|---------------|----------------------|
| `ticket_configs` extendida | Ya es 1:1 con User; tenant isolation resuelto | Nueva tabla `mp_credentials`: duplica la clave de tenant |
| `mp_webhook_events` | Log de idempotencia separado del negocio | Campo `processed` en `sale_tickets`: no registra intentos fallidos ni topics distintos de `payment` |
| `mp_payment_log` | Auditoría de cada transición de estado de pago | Usar `email_logs` existente: propósito distinto, no relaciona con ticket_id |

### 2.3 Índices críticos

```sql
-- Para idempotencia (lookup por external_id en webhook)
CREATE UNIQUE INDEX uq_mp_webhook_external ON mp_webhook_events(external_id);

-- Para consultar estado de pago de un ticket
CREATE INDEX idx_sale_tickets_mp_payment_id ON sale_tickets(mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- Para correlacionar logs por vendedor
CREATE INDEX idx_mp_payment_log_vendor ON mp_payment_log(vendor_user_id, created_at DESC);

-- Para limpiar eventos viejos
CREATE INDEX idx_mp_webhook_created ON mp_webhook_events(created_at);
```

---

## 3. Cifrado AES-256-GCM

### 3.1 Por qué AES-256-GCM sobre otras opciones

| Algoritmo | Confidencialidad | Integridad | Autenticación | Nonce requerido | Elección |
|-----------|-----------------|------------|--------------|----------------|---------|
| AES-256-CBC | ✅ | ❌ | ❌ | IV fijo posible | ❌ |
| AES-256-GCM | ✅ | ✅ | ✅ (tag) | IV aleatorio | **✅ Elegido** |
| RSA-2048 | ✅ | ❌ | ❌ | N/A | ❌ (lento, no para volumen) |
| BCrypt | ✅ (hash) | N/A | N/A | — | ❌ (no reversible) |

GCM proporciona **autenticación del cifrado** (AEAD): si el ciphertext es alterado en BD, la desencriptación falla con excepción en lugar de retornar datos corruptos silenciosamente.

### 3.2 Formato del valor cifrado en BD

```
Formato stored en columna TEXT:
  Base64Url( IV(12 bytes) || Ciphertext || AuthTag(16 bytes) )

Ejemplo:
  "dGVzdC1pdg==.dGVzdC1jaXBoZXJ0ZXh0.dGVzdC1hdXRodGFn"
  └── IV ──────┘└──── Ciphertext ───┘└──── Auth Tag ────┘

Separador: punto (para distinguir partes sin ambigüedad)
```

### 3.3 Gestión de la clave de cifrado

```mermaid
flowchart LR
    EnvVar["APP_ENCRYPTION_KEY\n(32 bytes hex, env var)"] --> KeyDerive["HKDF derive\n(salt: app name)\n→ AES SecretKey"]
    KeyDerive --> Encrypt["EncryptedStringConverter\n.convertToDatabaseColumn()"]
    KeyDerive --> Decrypt["EncryptedStringConverter\n.convertToEntityAttribute()"]
    Encrypt --> DB[("TEXT column\nBase64(IV+Cipher+Tag)")]
    DB --> Decrypt
```

**Regla de la clave:**
- Generada una vez: `openssl rand -hex 32`
- Guardada SOLO como env var en Render (no en código, no en `.properties`, no en git)
- Si se rota: migración de re-encriptación en lote (script fuera de ddl-auto)
- En desarrollo local: `.env` local ignorado por git

### 3.4 Firma de la clase `EncryptedStringConverter`

```java
// package: com.jafpsoft.ventas.security.crypto
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    // Llamado por JPA antes de escribir en BD
    @Override
    public String convertToDatabaseColumn(String plaintext);

    // Llamado por JPA después de leer de BD
    @Override
    public String convertToEntityAttribute(String ciphertext);

    // Verifica que la clave está correctamente configurada al iniciar
    @PostConstruct
    public void validateKey();
}
```

**Excepciones:**
- `CryptoConfigurationException extends RuntimeException` — `APP_ENCRYPTION_KEY` ausente o inválida al startup
- `CryptoOperationException extends RuntimeException` — falla de encrypt/decrypt (tag inválido = tampering detectado)

---

## 4. Máquina de Estados del Ticket

### 4.1 Diagrama de estados

```mermaid
stateDiagram-v2
    [*] --> DRAFT : POST /api/tickets (create)
    DRAFT --> PAYMENT_PENDING : createMercadoPagoPayment()
    DRAFT --> PAID : pago en efectivo/transferencia (flujo actual)
    DRAFT --> CANCELLED : cancel(reason)
    PAYMENT_PENDING --> PAYMENT_PROCESSING : webhook recibido topic=payment status=pending
    PAYMENT_PENDING --> PAID : webhook status=approved (sin processing intermedio)
    PAYMENT_PENDING --> PAYMENT_FAILED : webhook status=rejected|cancelled
    PAYMENT_PENDING --> CANCELLED : cancel(reason) — cancela también en MP
    PAYMENT_PROCESSING --> PAID : webhook status=approved
    PAYMENT_PROCESSING --> PAYMENT_FAILED : webhook status=rejected|cancelled
    PAID --> CANCELLED : cancel(reason) — también genera refund en MP si mp_payment_id existe
    PAYMENT_FAILED --> DRAFT : resetPaymentAttempt() — permite reintentar
    PAYMENT_FAILED --> CANCELLED : cancel(reason)
    CANCELLED --> [*] : estado final — número no se reutiliza
```

### 4.2 Enum `TicketStatus`

```java
// package: com.jafpsoft.ventas.model.enums
public enum TicketStatus {
    DRAFT,
    PAYMENT_PENDING,
    PAYMENT_PROCESSING,
    PAID,
    PAYMENT_FAILED,
    CANCELLED;

    // Retorna true si la transición current → next es válida
    public boolean canTransitionTo(TicketStatus next);

    // Verdadero si el ticket está en un estado terminal
    public boolean isTerminal();

    // Verdadero si hay un pago de MP en vuelo
    public boolean hasMercadoPagoPaymentInFlight();
}
```

**Excepción:**
- `IllegalTicketStateTransitionException(TicketStatus from, TicketStatus to)` — se lanza desde `SaleTicketService` antes de cualquier `setStatus()`

### 4.3 Impacto del stock por estado

| Transición | Ajuste de stock | Quién lo dispara |
|-----------|----------------|-----------------|
| `DRAFT → PAID` (efectivo) | `delta = -1` | `SaleTicketService.updateStatus()` |
| `DRAFT → PAYMENT_PENDING` | `delta = 0` (reserva lógica, no física aún) | `MercadoPagoPaymentService.createPreference()` |
| `PAYMENT_PENDING → PAID` (webhook) | `delta = -1` | `MercadoPagoWebhookProcessor.onPaymentApproved()` |
| `PAYMENT_FAILED → DRAFT` | `delta = 0` | `SaleTicketService.resetPaymentAttempt()` |
| `PAID → CANCELLED` | `delta = +1` | `SaleTicketService.cancel()` |
| `PAYMENT_PENDING → CANCELLED` | `delta = 0` | `SaleTicketService.cancel()` |

> Nota: El stock solo se ajusta al confirmar el pago (PAID) o al cancelar un ticket ya pagado. El estado `PAYMENT_PENDING` no reserva stock para evitar bloqueos en casos de abandono.

---

## 5. OAuth Flow — Conexión de Cuenta MP

### 5.1 Flujo completo

```mermaid
sequenceDiagram
    actor Vendedor
    participant Frontend
    participant Backend as KB Backend\n(Spring Boot)
    participant MPOA as MercadoPago\nOAuth API
    participant BD as ticket_configs\n(PostgreSQL)

    Vendedor->>Frontend: Clic "Conectar Mercado Pago"
    Frontend->>Backend: GET /api/tickets/config/mercadopago/auth-url
    Backend-->>Frontend: { authUrl: "https://auth.mercadopago.com/authorization?client_id=...&state=STATE_JWT" }
    Note over Backend: STATE = JWT firmado con JWT_SECRET\ncontiene: userId, nonce, exp=5min\nPreviene CSRF en el callback
    Frontend->>Vendedor: Redirige a authUrl (nueva pestaña o redirect)
    Vendedor->>MPOA: Inicia sesión en MP y autoriza
    MPOA->>Frontend: Redirect a /tickets/config?mp_code=AUTH_CODE&state=STATE
    Frontend->>Backend: POST /api/tickets/config/mercadopago/connect { code, state }
    Note over Backend: 1. Valida state JWT (firma + exp + userId == userId del JWT)
    Backend->>MPOA: POST /oauth/token { code, client_id, client_secret, redirect_uri }
    MPOA-->>Backend: { access_token, refresh_token, user_id, public_key, expires_in, scope }
    Note over Backend: 2. Cifra access_token y refresh_token con AES-256-GCM\n3. Calcula expires_at = now() + expires_in
    Backend->>BD: UPDATE ticket_configs SET mp_access_token=ENC, mp_refresh_token=ENC,\n mp_user_id=ID, mp_public_key=KEY, mp_enabled=true, mp_token_expires_at=TS
    BD-->>Backend: OK
    Backend->>MPOA: Registra webhook: POST /v1/webhooks { url, events: ["payment"] }
    MPOA-->>Backend: { id, secret }
    Note over Backend: Cifra y guarda mp_webhook_secret
    Backend->>BD: UPDATE ticket_configs SET mp_webhook_secret=ENC_SECRET
    BD-->>Backend: OK
    Backend-->>Frontend: { mpEnabled: true, mpUserId: "123456", publicKey: "TEST-abc..." }
    Frontend->>Vendedor: "Cuenta de Mercado Pago conectada ✓"
```

### 5.2 Renovación automática del Token

```mermaid
sequenceDiagram
    participant Caller as MercadoPagoApiClient
    participant TM as TokenManager
    participant BD as ticket_configs
    participant MPOA as MP OAuth API

    Caller->>TM: getValidToken(userId)
    TM->>BD: SELECT mp_access_token, mp_token_expires_at FROM ticket_configs WHERE user_id=?
    BD-->>TM: { encryptedToken, expiresAt }
    TM->>TM: decrypt(encryptedToken)
    alt Token válido (expiresAt > now() + 5min)
        TM-->>Caller: plaintext access_token
    else Token expirado o próximo a expirar
        TM->>BD: SELECT mp_refresh_token WHERE user_id=? [PESSIMISTIC_WRITE]
        BD-->>TM: encryptedRefreshToken
        TM->>MPOA: POST /oauth/token { grant_type: refresh_token, refresh_token: decrypted }
        MPOA-->>TM: { access_token, refresh_token, expires_in }
        TM->>BD: UPDATE ticket_configs SET mp_access_token=ENC_NEW,\n mp_refresh_token=ENC_NEW, mp_token_expires_at=NEW_TS
        TM-->>Caller: plaintext new_access_token
    end
```

**Lock pesimista en refresh**: Mismo patrón que la numeración de tickets (`@Lock(PESSIMISTIC_WRITE)`) para evitar que dos threads simultáneos intenten renovar el mismo token y generen conflictos.

### 5.3 Desconexión

```mermaid
sequenceDiagram
    actor Vendedor
    participant Frontend
    participant Backend
    participant MP as MP API
    participant BD

    Vendedor->>Frontend: Clic "Desconectar Mercado Pago"
    Frontend->>Backend: DELETE /api/tickets/config/mercadopago
    Backend->>MP: DELETE /v1/webhooks/{webhookId} (usando access_token)
    MP-->>Backend: 204
    Backend->>BD: UPDATE ticket_configs SET mp_access_token=NULL, mp_refresh_token=NULL,\n mp_enabled=false, mp_webhook_secret=NULL, mp_public_key=NULL,\n mp_user_id=NULL, mp_token_expires_at=NULL
    BD-->>Backend: OK
    Note over Backend: Los sale_tickets con mp_payment_id histórico\npermanecen intactos (auditoría)
    Backend-->>Frontend: { mpEnabled: false }
```

---

## 6. Payments — Creación de Preferencias y Consulta

### 6.1 Crear Preferencia (initiar pago)

```mermaid
sequenceDiagram
    actor Vendedor
    participant Frontend
    participant STC as SaleTicketController
    participant MPS as MercadoPagoPaymentService
    participant TM as TokenManager
    participant CB as Circuit Breaker\n(Resilience4j)
    participant MPAC as MercadoPagoApiClient
    participant MPAPI as MP API
    participant BD

    Vendedor->>Frontend: Clic "Pagar con Mercado Pago"
    Frontend->>STC: POST /api/tickets/{id}/payment/mercadopago
    STC->>MPS: createPreference(ticketId, userId)
    MPS->>BD: findOwned(ticketId, userId) — valida tenant
    MPS->>MPS: validateStatus(ticket): debe ser DRAFT
    MPS->>TM: getValidToken(userId) — renueva si necesario
    TM-->>MPS: plaintext access_token
    MPS->>MPS: buildPreferenceRequest(ticket, config, notificationUrl)
    MPS->>CB: execute(apiClient.createPreference(token, request))
    CB->>MPAC: POST /checkout/preferences
    MPAC->>MPAPI: HTTP POST con Bearer access_token
    MPAPI-->>MPAC: { id, init_point, sandbox_init_point }
    MPAC-->>CB: PreferenceResponse
    CB-->>MPS: PreferenceResponse
    MPS->>BD: UPDATE sale_tickets SET mp_preference_id=?, status=PAYMENT_PENDING
    MPS->>BD: INSERT mp_payment_log (preference_created, DRAFT→PAYMENT_PENDING)
    MPS-->>STC: { preferenceId, initPoint, sandboxInitPoint }
    STC-->>Frontend: 200 { preferenceId, initPoint }
    Frontend->>Vendedor: Redirige/muestra link de pago a MP
```

### 6.2 Consultar estado de pago (polling fallback)

```mermaid
sequenceDiagram
    participant Frontend
    participant STC as SaleTicketController
    participant MPS as MercadoPagoPaymentService
    participant CB as Circuit Breaker
    participant MPAC as MercadoPagoApiClient
    participant MPAPI as MP API
    participant BD

    loop Polling cada 3s (máx 10 intentos)
        Frontend->>STC: GET /api/tickets/{id}/payment/status
        STC->>MPS: getPaymentStatus(ticketId, userId)
        MPS->>BD: SELECT mp_payment_id, mp_status, status FROM sale_tickets WHERE id=? AND user_id=?
        alt mp_status ya es final (approved/rejected/cancelled)
            BD-->>MPS: { mp_status: "approved", status: "PAID" }
            MPS-->>Frontend: { status: "PAID", mpStatus: "approved" } — Frontend detiene polling
        else mp_status aún pendiente
            MPS->>CB: execute(apiClient.getPayment(token, mp_payment_id))
            CB->>MPAC: GET /v1/payments/{id}
            MPAC->>MPAPI: HTTP GET
            MPAPI-->>MPAC: { status, status_detail, date_approved }
            MPAC-->>MPS: PaymentDetails
            MPS->>MPS: syncStatusFromMp(ticket, paymentDetails)
            MPS->>BD: UPDATE sale_tickets SET mp_status=?, mp_paid_at=? (si approved)
            MPS-->>Frontend: { status: "PAYMENT_PENDING", mpStatus: "pending" }
        end
    end
```

### 6.3 Reembolso

```mermaid
sequenceDiagram
    actor Vendedor
    participant Frontend
    participant STC as SaleTicketController
    participant MPS as MercadoPagoPaymentService
    participant CB as Circuit Breaker
    participant MPAC as MercadoPagoApiClient
    participant MPAPI as MP API
    participant STS as SaleTicketService
    participant BD

    Note over Vendedor: Solo disponible si ticket.status == PAID\ny ticket.mp_payment_id != null
    Vendedor->>Frontend: Clic "Anular ticket" (con motivo)
    Frontend->>STC: PATCH /api/tickets/{id}/cancel { reason, refundInMp: true }
    STC->>MPS: refundPayment(ticketId, userId, reason)
    MPS->>BD: findOwned(ticketId, userId)
    MPS->>MPS: validateStatus(ticket): debe ser PAID
    MPS->>TM: getValidToken(userId)
    TM-->>MPS: access_token
    MPS->>CB: execute(apiClient.refundPayment(token, mp_payment_id))
    CB->>MPAC: POST /v1/payments/{id}/refunds
    MPAC->>MPAPI: HTTP POST
    MPAPI-->>MPAC: { id, status: "approved" } — o error
    MPAC-->>MPS: RefundResponse
    MPS->>STS: cancel(ticketId, userId, reason) — vía service (transaccional)
    Note over STS: Ajusta stock +1\nregistra cancellation_reason\nSTATUS → CANCELLED
    MPS->>BD: UPDATE sale_tickets SET mp_status="refunded"
    MPS->>BD: INSERT mp_payment_log (refund_completed, PAID→CANCELLED)
    MPS-->>Frontend: TicketResponse { status: "CANCELLED" }
    Frontend->>Vendedor: "Ticket anulado y reembolso procesado"
```

---

## 7. Circuit Breaker — Resiliencia contra fallos de MP

### 7.1 Por qué es necesario

La API de Mercado Pago puede:
- Responder lento (timeout) en picos de tráfico
- Retornar 503 (mantenimiento programado)
- Fallar intermitentemente (errores 5xx transitorios)

Sin Circuit Breaker, un fallo de MP se propaga: el vendedor ve error 500, los requests se acumulan en el pool de threads, el pool se satura, otras funciones del sistema (no relacionadas con MP) también fallan.

### 7.2 Configuración del Circuit Breaker (Resilience4j)

```mermaid
stateDiagram-v2
    [*] --> CLOSED : Estado inicial
    CLOSED --> OPEN : tasa de fallo > 50%\nen ventana de 10 llamadas
    OPEN --> HALF_OPEN : después de 30 segundos
    HALF_OPEN --> CLOSED : 3 llamadas de prueba exitosas
    HALF_OPEN --> OPEN : alguna llamada de prueba falla
    note right of OPEN : Respuesta inmediata\ncon MercadoPagoUnavailableException\nNo espera timeout
    note right of CLOSED : Registra métricas\nde éxito/fallo
```

**Configuración por operación:**

| Operación | Timeout | Reintentos | Circuit Breaker | Fallback |
|-----------|---------|-----------|----------------|---------|
| `createPreference()` | 10s | 2 (backoff 1s, 3s) | Ventana 10 calls, fallo >50% | Error al usuario: "MP no disponible, use otro método" |
| `getPayment()` | 8s | 3 (backoff 1s, 2s, 5s) | Mismo | Retorna cached status de BD |
| `refundPayment()` | 15s | 1 (sin retry — idempotente) | Mismo | Error al usuario: "Reintente en unos minutos" |
| `refreshToken()` | 10s | 2 | Propio (más permisivo) | Log error + alerta admin |
| `registerWebhook()` | 10s | 2 | Independiente | Solo log — no crítico al momento |

### 7.3 Flujo del Circuit Breaker

```mermaid
flowchart TD
    Caller["MercadoPagoPaymentService\n(llama operación)"]
    CB["Circuit Breaker\n(Resilience4j)"]
    Retry["Retry Decorator\n(@Retryable sobre CB)"]
    MPAC["MercadoPagoApiClient\n(HTTP call)"]
    MPAPI["MP API"]

    Caller --> Retry
    Retry --> CB
    CB --> MPAC

    MPAC -->|HTTP OK| MPAPI
    MPAPI -->|200 OK| MPAC
    MPAC -->|Éxito| CB
    CB -->|Cuenta éxito| Retry
    Retry -->|Retorna resultado| Caller

    MPAPI -->|"5xx / timeout"| MPAC
    MPAC -->|"Lanza MercadoPagoApiException"| CB
    CB -->|"Si OPEN: no llama, lanza\nMercadoPagoUnavailableException"| Caller
    CB -->|"Si CLOSED: registra fallo\npasa al Retry"| Retry
    Retry -->|"Si quedan reintentos: espera backoff"| CB
    Retry -->|"Si agotó reintentos: lanza excepción"| Caller
```

**Orden de decoradores** (importante — el orden afecta el comportamiento):
```
Request → TimeLimiter → CircuitBreaker → Retry → MercadoPagoApiClient
```
El `TimeLimiter` va primero para asegurar que los reintentos no excedan el tiempo total. El `Retry` va último para reintentar solo si el Circuit Breaker está CLOSED.

---

## 8. Webhooks — Idempotencia y Procesamiento Seguro

### 8.1 Flujo completo del webhook

```mermaid
sequenceDiagram
    participant MP as Mercado Pago
    participant WC as WebhookController
    participant WV as WebhookValidator
    participant WP as WebhookProcessor\n(@Async)
    participant WER as WebhookEventRepository
    participant MPS as MercadoPagoPaymentService
    participant STS as SaleTicketService
    participant ES as EmailService
    participant BD

    MP->>WC: POST /api/webhooks/mercadopago\nHeaders: x-signature: ts=...,v1=HMAC\nBody: { type: "payment", data: { id: "123" } }

    WC->>WV: validate(requestBody, xSignature, vendorUserId)
    Note over WV: 1. Extrae ts y v1 del header\n2. Construye mensaje: id:{id};request-id:{reqId};ts:{ts};\n3. Obtiene mp_webhook_secret del tenant (CIFRADO → descifrado)\n4. HMAC-SHA256(secret, message)\n5. Compara con timing-safe MessageDigest.isEqual()\n6. Verifica que ts no tenga más de 5 minutos de antigüedad
    WV-->>WC: valid / throws WebhookSignatureException

    WC->>BD: INSERT mp_webhook_events (external_id="payment:123", status=received, raw_body, correlation_id)
    Note over BD: Si external_id ya existe → DuplicateKeyException\n→ WebhookController responde 200 OK silenciosamente\n(MP deja de reintentar)

    WC-->>MP: 200 OK (respuesta INMEDIATA — antes de procesar)
    Note over WC: Responder 200 ANTES del procesamiento\nMP no espera más de 5s antes de reintentar

    WC->>WP: processAsync(webhookEventId, topic, externalId)
    Note over WC,WP: Procesamiento es @Async — decoupled del HTTP thread

    WP->>BD: UPDATE mp_webhook_events SET status=processing
    WP->>MPS: handlePaymentWebhook(externalPaymentId, vendorUserId, correlationId)
    MPS->>MPS: getValidToken(userId) — via TokenManager
    MPS->>BD: GET /v1/payments/{externalPaymentId} — via Circuit Breaker
    Note over MPS: Siempre consulta el estado real en MP\nNo confía solo en el body del webhook (puede estar desactualizado)

    alt MP status = "approved"
        MPS->>STS: confirmPayment(ticketId, mpPaymentId, mpStatus, paidAt)
        STS->>BD: UPDATE sale_tickets SET status=PAID, mp_status=approved, mp_paid_at=TS
        STS->>STS: adjustStock(items, delta=-1, userId)
        STS->>BD: INSERT mp_payment_log (payment_received, PAYMENT_PENDING→PAID)
        MPS->>ES: sendPaymentConfirmationEmail(ticket) [async, retryable]
    else MP status = "rejected" or "cancelled"
        MPS->>STS: failPayment(ticketId, mpPaymentId, mpStatus, statusDetail)
        STS->>BD: UPDATE sale_tickets SET status=PAYMENT_FAILED, mp_status_detail=DETAIL
        STS->>BD: INSERT mp_payment_log (payment_failed, PAYMENT_PROCESSING→PAYMENT_FAILED)
    else MP status = "pending" or "in_process"
        MPS->>BD: UPDATE sale_tickets SET status=PAYMENT_PROCESSING, mp_status=pending
        STS->>BD: INSERT mp_payment_log (status_updated)
    end

    WP->>BD: UPDATE mp_webhook_events SET status=processed, processed_at=NOW()
    Note over WP: Si cualquier paso falla:\n→ UPDATE mp_webhook_events SET status=failed, error_message=...\n→ Log con correlationId para debugging
```

### 8.2 Garantía de idempotencia

```mermaid
flowchart TD
    Recv["Webhook recibido\nexternal_id = 'payment:123456'"]
    Validate["Validar HMAC\n(x-signature)"]
    TryInsert["INSERT mp_webhook_events\n(external_id UNIQUE)"]
    Duplicate{"¿DuplicateKeyException?"}
    Respond200["Responder 200 OK"]
    Process["Procesar async"]

    Recv --> Validate
    Validate -->|Firma inválida| Resp401["Responder 401\n(sin loguear body)"]
    Validate -->|OK| TryInsert
    TryInsert --> Duplicate
    Duplicate -->|Sí — ya procesado| Respond200
    Duplicate -->|No — primer intento| Respond200
    Respond200 --> Process
    Process -->|ya procesado| Skip["No hace nada (idempotente)"]
    Process -->|primer intento| Execute["Ejecutar lógica de negocio"]
```

**La garantía**: La restricción `UNIQUE` en `external_id` de `mp_webhook_events` es la línea de defensa a nivel de base de datos. Incluso si dos threads procesan el mismo webhook simultáneamente, solo uno logrará hacer el INSERT exitoso. El otro recibirá `DataIntegrityViolationException` y responderá 200 silenciosamente.

### 8.3 Manejo de webhooks de topics no-payment

| Topic de MP | Acción |
|-------------|--------|
| `payment` | Procesar plenamente (actualizar ticket, stock, email) |
| `merchant_order` | Loguear en `mp_webhook_events`, no procesar (informativo) |
| `chargebacks` | Loguear + notificar al admin vía email (acción manual requerida) |
| Cualquier otro | Loguear como `ignored`, responder 200 |

---

## 9. Observabilidad — Logging, Métricas y Correlation-ID

### 9.1 Correlation ID — Trazabilidad end-to-end

```mermaid
flowchart LR
    FrontReq["Frontend Request\nX-Correlation-Id: (no enviado)"]
    CorrelFilter["CorrelationIdFilter\n@Component\nOrder: primero en cadena"]
    Generate["UUID.randomUUID()\n→ correlationId"]
    MDC["MDC.put('correlationId', id)\nMDC.put('userId', userId)\nMDC.put('tenantId', userId)"]
    Controller["Controller\n@Slf4j logs con MDC"]
    Service["Service\n@Slf4j logs con MDC"]
    AsyncCtx["@Async Methods\nTaskDecorator copia MDC\nal thread hijo"]
    Webhook["WebhookController\nusa correlation_id del MP request-id\nO genera uno nuevo"]
    DB["mp_webhook_events\n.correlation_id guardado"]
    Response["Response Header\nX-Correlation-Id: {id}"]

    FrontReq --> CorrelFilter
    CorrelFilter --> Generate
    Generate --> MDC
    MDC --> Controller
    Controller --> Service
    Service --> AsyncCtx
    CorrelFilter --> Response
    Webhook --> DB
```

**Logback pattern** (en `logback-spring.xml`):
```
%d{ISO8601} [%thread] %-5level %logger{36} [corr=%X{correlationId}] [user=%X{userId}] - %msg%n
```

Esto permite filtrar todos los logs de una transacción específica con:
```
grep "corr=abc12345" application.log
```

### 9.2 Estrategia de Logging por capa

```mermaid
graph TD
    subgraph Frontend
        FE_L["Console.error en catch\n+ toast en español"]
    end

    subgraph Controller
        CT_L["INFO: request recibido\n{method, path, userId, correlationId}\nWARN: validación fallida\n❌ NO loguear bodies con datos de pago"]
    end

    subgraph Service
        SV_L["INFO: operación iniciada/completada\n{ticketId, userId, mpPaymentId}\nWARN: transición de estado inesperada\nERROR: excepción de negocio con context"]
    end

    subgraph Integration
        IN_L["DEBUG: request a MP API\n{method, url, durationMs}\nINFO: response status\nERROR: API error {statusCode, mpErrorCode, correlationId}\n❌ NUNCA loguear access_token o body con datos de tarjeta"]
    end

    subgraph Webhook
        WB_L["INFO: webhook recibido {external_id, topic}\nINFO: resultado {status, durationMs}\nWARN: duplicado detectado\nERROR: fallo de procesamiento con correlationId"]
    end

    Frontend --> Controller
    Controller --> Service
    Service --> Integration
    Service --> Webhook
```

**Regla de oro de logging**: NUNCA loguear `access_token`, `refresh_token`, `webhook_secret`, ni datos de tarjeta. Si se necesita debuggear, loguear solo el `mpPaymentId` y el `userId`.

### 9.3 Métricas con Micrometer (Actuator)

```mermaid
graph LR
    subgraph Contadores
        C1["mp.preference.created\nTags: userId, status"]
        C2["mp.payment.confirmed\nTags: userId"]
        C3["mp.payment.failed\nTags: userId, reason"]
        C4["mp.webhook.received\nTags: topic"]
        C5["mp.webhook.duplicate\nTags: topic"]
        C6["mp.token.refreshed\nTags: userId"]
        C7["mp.refund.requested\nTags: userId"]
    end

    subgraph Timers
        T1["mp.api.request.duration\nTags: operation, status\nPercentiles: p50, p95, p99"]
        T2["mp.webhook.processing.duration\nTags: topic, result"]
    end

    subgraph Gauges
        G1["mp.circuit_breaker.state\nTags: name\nValues: 0=CLOSED, 1=OPEN, 2=HALF_OPEN"]
        G2["mp.pending_payments.count\nTotal tickets en PAYMENT_PENDING"]
    end

    subgraph Alertas_recomendadas
        A1["ALERTA: mp.circuit_breaker.state == 1\n→ Notificar admin"]
        A2["ALERTA: mp.payment.failed rate > 20%\nen ventana de 5min"]
        A3["ALERTA: mp.pending_payments.count > 50\npor más de 10min"]
    end
```

**Endpoint de métricas**: `/actuator/metrics` (solo accesible desde ROLE_ADMIN o IP interna)

### 9.4 Tabla de Logs de Auditoría

`mp_payment_log` funciona como log estructurado inmutable para auditoría financiera:

```
event_type              | Cuándo se registra
------------------------|---------------------------------------------
preference_created      | POST /checkout/preferences exitoso
payment_received        | Webhook topic=payment status=approved
payment_failed          | Webhook topic=payment status=rejected
refund_requested        | POST /v1/payments/{id}/refunds iniciado
refund_completed        | Refund confirmado por MP
token_refreshed         | TokenManager renovó access_token
webhook_duplicate       | External_id ya existía (idempotencia)
status_sync             | Polling: estado sincronizado desde MP
```

---

## 10. Arquitectura de Packages

```
com.jafpsoft.ventas/
│
├── controller/
│   ├── SaleTicketController.java          (+ endpoints /payment/*)
│   ├── TicketConfigController.java        (+ endpoints /mercadopago)
│   └── WebhookController.java             [NUEVO]
│
├── service/
│   ├── SaleTicketService.java             (modificado: TicketStatus enum, confirmPayment, failPayment)
│   ├── MercadoPagoPaymentService.java     [NUEVO] orquestación de pagos
│   └── MercadoPagoOAuthService.java       [NUEVO] conexión/desconexión de cuenta
│
├── integration/
│   └── mercadopago/
│       ├── MercadoPagoApiClient.java      [NUEVO] HTTP calls (con CB)
│       ├── MercadoPagoWebhookValidator.java [NUEVO] HMAC-SHA256
│       ├── MercadoPagoTokenManager.java   [NUEVO] refresh automático
│       └── MercadoPagoWebhookProcessor.java [NUEVO] @Async processor
│
├── model/
│   ├── SaleTicket.java                    (+ mp_preference_id, mp_payment_id, mp_status)
│   ├── TicketConfig.java                  (+ mp_access_token ENCRYPTED, ...)
│   ├── MercadoPagoWebhookEvent.java       [NUEVO]
│   ├── MercadoPagoPaymentLog.java         [NUEVO]
│   └── enums/
│       └── TicketStatus.java              [NUEVO]
│
├── dto/
│   ├── ticket/
│   │   ├── TicketRequest.java
│   │   └── TicketResponse.java            (+ mpStatus, mpPreferenceId)
│   └── payment/                           [NUEVO package]
│       ├── MercadoPagoPreferenceResponse.java
│       ├── MercadoPagoPaymentStatusResponse.java
│       ├── MercadoPagoWebhookDto.java
│       ├── MercadoPagoConnectRequest.java
│       └── MercadoPagoConnectResponse.java
│
├── repository/
│   ├── MercadoPagoWebhookEventRepository.java [NUEVO]
│   └── MercadoPagoPaymentLogRepository.java   [NUEVO]
│
├── security/
│   └── crypto/
│       └── EncryptedStringConverter.java  [NUEVO]
│
├── config/
│   └── AppConfig.java                     (+ @EnableRetry, ResilienceConfig bean)
│
└── exception/
    ├── MercadoPagoException.java           [NUEVO] base
    ├── MercadoPagoApiException.java        [NUEVO]
    ├── MercadoPagoUnavailableException.java [NUEVO]
    ├── MercadoPagoTokenException.java      [NUEVO]
    ├── WebhookSignatureException.java      [NUEVO]
    └── IllegalTicketStateTransitionException.java [NUEVO]
```

---

## 11. Firmas de Métodos y Excepciones

### 11.1 Jerarquía de Excepciones

```
RuntimeException
└── MercadoPagoException(String message, String correlationId)
    ├── MercadoPagoApiException(int statusCode, String mpErrorCode, String message, String correlationId)
    │     Cuándo: MP retorna 4xx/5xx
    ├── MercadoPagoUnavailableException(String message, String correlationId)
    │     Cuándo: Circuit Breaker en OPEN o timeout total agotado
    ├── MercadoPagoTokenException(Long userId, String reason)
    │     Cuándo: access_token inválido, refresh_token expirado, OAuth revocado
    └── WebhookSignatureException(String reason)
          Cuándo: HMAC inválido, timestamp expirado

IllegalStateException
└── IllegalTicketStateTransitionException(TicketStatus from, TicketStatus to, Long ticketId)

RuntimeException
└── CryptoConfigurationException(String message)
      Cuándo: APP_ENCRYPTION_KEY ausente al startup (@PostConstruct)
└── CryptoOperationException(String message, Throwable cause)
      Cuándo: auth tag inválido en GCM decrypt (tampering detectado)
```

### 11.2 `EncryptedStringConverter`

```java
// package: com.jafpsoft.ventas.security.crypto
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    // Retorna null si plaintext es null; Base64(IV+Cipher+Tag) si no
    @Override
    public String convertToDatabaseColumn(String plaintext);
    //   throws: CryptoOperationException (fallo de cifrado)

    // Retorna null si ciphertext es null; descifra y valida auth tag
    @Override
    public String convertToEntityAttribute(String ciphertext);
    //   throws: CryptoOperationException (auth tag inválido = tampering)

    // Llamado al startup de Spring para fail-fast si la key no está
    @PostConstruct
    public void validateKey();
    //   throws: CryptoConfigurationException
}
```

### 11.3 `MercadoPagoApiClient`

```java
// package: com.jafpsoft.ventas.integration.mercadopago
public class MercadoPagoApiClient {

    // Crea preferencia de pago en MP
    // Circuit Breaker: sí | Timeout: 10s | Retries: 2
    public PreferenceResponse createPreference(String accessToken, PreferenceRequest request, String correlationId);
    //   throws: MercadoPagoApiException (4xx), MercadoPagoUnavailableException (CB open / timeout)

    // Consulta el estado de un pago específico
    // Circuit Breaker: sí | Timeout: 8s | Retries: 3
    public PaymentDetails getPayment(String accessToken, String paymentId, String correlationId);
    //   throws: MercadoPagoApiException, MercadoPagoUnavailableException

    // Solicita reembolso total del pago
    // Circuit Breaker: sí | Timeout: 15s | Retries: 1 (refund es idempotente en MP)
    public RefundResponse refundPayment(String accessToken, String paymentId, String correlationId);
    //   throws: MercadoPagoApiException, MercadoPagoUnavailableException

    // Registra una URL de webhook en la cuenta del vendedor
    // Circuit Breaker: propio (más permisivo) | Timeout: 10s | Retries: 2
    public WebhookRegistrationResponse registerWebhook(String accessToken, String notificationUrl, List<String> events);
    //   throws: MercadoPagoApiException, MercadoPagoUnavailableException

    // Elimina el webhook registrado
    public void deleteWebhook(String accessToken, String webhookId);
    //   throws: MercadoPagoApiException (no-op si 404, el webhook ya fue eliminado)
}
```

### 11.4 `MercadoPagoTokenManager`

```java
// package: com.jafpsoft.ventas.integration.mercadopago
public class MercadoPagoTokenManager {

    // Retorna un access_token válido para el userId dado
    // Refresca automáticamente si expira en < 5 minutos
    // Usa @Lock(PESSIMISTIC_WRITE) en ticket_configs para evitar doble refresh
    public String getValidToken(Long userId);
    //   throws: MercadoPagoTokenException (si refresh falla o MP revocó el token)
    //           EntityNotFoundException (si el tenant no tiene MP conectado)

    // Intercambia el authorization_code por access_token + refresh_token
    // Solo llamado desde MercadoPagoOAuthService.connectAccount()
    public TokenExchangeResult exchangeAuthorizationCode(String authCode, String redirectUri);
    //   throws: MercadoPagoApiException (código inválido o expirado)

    // Invalida tokens locales sin llamar a MP (para disconnect)
    @Transactional
    public void revokeLocalTokens(Long userId);
}
```

### 11.5 `MercadoPagoOAuthService`

```java
// package: com.jafpsoft.ventas.service
public class MercadoPagoOAuthService {

    // Genera la URL de autorización de MP con state JWT firmado
    // state = JWT(userId, nonce, exp=5min) — previene CSRF
    public String buildAuthorizationUrl(Long userId);

    // Procesa el callback: valida state, intercambia code, guarda tokens cifrados
    @Transactional
    public MercadoPagoConnectResponse connectAccount(Long userId, String authCode, String state);
    //   throws: IllegalArgumentException (state inválido o expirado)
    //           MercadoPagoApiException (exchange fallido)
    //           MercadoPagoTokenException (scope insuficiente)

    // Retorna el estado de conexión MP del tenant (sin exponer access_token)
    public MercadoPagoStatusResponse getConnectionStatus(Long userId);

    // Desconecta la cuenta: elimina webhook en MP, limpia campos en TicketConfig
    @Transactional
    public void disconnectAccount(Long userId);
    //   throws: EntityNotFoundException (si no tiene cuenta conectada)
}
```

### 11.6 `MercadoPagoPaymentService`

```java
// package: com.jafpsoft.ventas.service
public class MercadoPagoPaymentService {

    // Crea preferencia en MP y transiciona ticket DRAFT→PAYMENT_PENDING
    @Transactional
    public MercadoPagoPreferenceResponse createPreference(Long ticketId, Long userId, String correlationId);
    //   throws: EntityNotFoundException (ticket no encontrado)
    //           IllegalTicketStateTransitionException (ticket no está en DRAFT)
    //           MercadoPagoTokenException (MP no conectado o token inválido)
    //           MercadoPagoUnavailableException (CB open)

    // Consulta estado actual: primero en BD, luego en MP si está pendiente
    public MercadoPagoPaymentStatusResponse getPaymentStatus(Long ticketId, Long userId, String correlationId);
    //   throws: EntityNotFoundException

    // Inicia reembolso en MP y transiciona ticket PAID→CANCELLED
    @Transactional
    public TicketResponse refundPayment(Long ticketId, Long userId, String reason, String correlationId);
    //   throws: IllegalTicketStateTransitionException (ticket no está en PAID)
    //           MercadoPagoApiException (reembolso rechazado por MP)

    // Confirma un pago aprobado (llamado desde WebhookProcessor)
    @Transactional
    public void confirmPayment(Long ticketId, String mpPaymentId, String mpStatus, LocalDateTime paidAt, String correlationId);
    //   throws: IllegalTicketStateTransitionException

    // Registra fallo de pago (llamado desde WebhookProcessor)
    @Transactional
    public void failPayment(Long ticketId, String mpPaymentId, String mpStatus, String statusDetail, String correlationId);

    // Permite reintentar un pago fallido: PAYMENT_FAILED→DRAFT, limpia mp_preference_id
    @Transactional
    public TicketResponse resetPaymentAttempt(Long ticketId, Long userId);
    //   throws: IllegalTicketStateTransitionException (solo desde PAYMENT_FAILED)
}
```

### 11.7 `MercadoPagoWebhookValidator`

```java
// package: com.jafpsoft.ventas.integration.mercadopago
public class MercadoPagoWebhookValidator {

    // Valida la firma del webhook contra el secret del tenant
    // Previene: CSRF, replay attacks (max 5min), tampering del body
    public void validate(String requestBody, String xSignatureHeader, Long vendorUserId);
    //   throws: WebhookSignatureException("HMAC_MISMATCH") — firma inválida
    //           WebhookSignatureException("TIMESTAMP_EXPIRED") — ts > 5 minutos
    //           WebhookSignatureException("INVALID_FORMAT") — header malformado
    //           EntityNotFoundException — tenant no tiene webhook secret configurado

    // Extrae el vendorUserId del requestParam o body del webhook
    // MP incluye el user.id del vendedor en el webhook
    public Long extractVendorUserId(Map<String, String> requestParams, String body);
    //   throws: IllegalArgumentException (si no se puede extraer)
}
```

### 11.8 `MercadoPagoWebhookProcessor`

```java
// package: com.jafpsoft.ventas.integration.mercadopago
public class MercadoPagoWebhookProcessor {

    // Procesa el webhook de forma asíncrona
    // El @Async copia el MDC para mantener el correlationId
    @Async
    public void processAsync(Long webhookEventId, String topic, String externalId, Long vendorUserId, String correlationId);

    // Maneja específicamente eventos de tipo payment
    // SIEMPRE consulta el estado real en MP (no confía en el body del webhook)
    // Retryable: 3 reintentos con backoff exponencial si falla la consulta a MP
    @Retryable(retryFor = MercadoPagoUnavailableException.class, maxAttempts = 3,
               backoff = @Backoff(delay = 2000, multiplier = 2))
    void handlePaymentEvent(String mpPaymentId, Long vendorUserId, Long webhookEventId, String correlationId);
    //   throws: MercadoPagoUnavailableException (agotados reintentos)
    //           MercadoPagoApiException (error de MP — registra como failed)
}
```

### 11.9 `WebhookController`

```java
// package: com.jafpsoft.ventas.controller
// Ruta: POST /api/webhooks/mercadopago — sin autenticación JWT
@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    // Punto de entrada para notificaciones de Mercado Pago (IPN)
    // 1. Valida HMAC — responde 401 si inválido (sin loguear body)
    // 2. Intenta INSERT en mp_webhook_events — si duplicado, responde 200 silencioso
    // 3. Responde 200 INMEDIATAMENTE (antes de procesar)
    // 4. Delega procesamiento a @Async WebhookProcessor
    @PostMapping("/mercadopago")
    @RateLimiter(name = "mp-webhook")  // 200 req/min por IP
    public ResponseEntity<Void> handleMercadoPagoWebhook(
        @RequestBody String rawBody,
        @RequestHeader("x-signature") String xSignature,
        @RequestHeader(value = "x-request-id", required = false) String requestId,
        @RequestParam Map<String, String> params
    );
    //   returns: 200 siempre (si firma válida) — MP reintenta si recibe otro status
    //   returns: 401 si WebhookSignatureException (para no dar info al atacante, loguear internamente)
}
```

### 11.10 `SaleTicketController` — Nuevos endpoints

```java
// Endpoints nuevos en el SaleTicketController existente

// Inicia el proceso de pago con MP — crea preferencia y retorna link
@PostMapping("/{id}/payment/mercadopago")
@RateLimiter(name = "mp-create-payment")  // 10 req/min por usuario
public ResponseEntity<MercadoPagoPreferenceResponse> createMercadoPagoPayment(
    @PathVariable Long id,
    @AuthenticationPrincipal CustomUserDetails user,
    @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId
);
//   throws → 404 NOT_FOUND si ticket no existe
//   throws → 409 CONFLICT si ticket no está en DRAFT (IllegalTicketStateTransitionException)
//   throws → 503 SERVICE_UNAVAILABLE si MP no disponible (MercadoPagoUnavailableException)
//   throws → 424 FAILED_DEPENDENCY si MP no está conectado (MercadoPagoTokenException)

// Consulta el estado actual del pago — para polling del frontend
@GetMapping("/{id}/payment/status")
public ResponseEntity<MercadoPagoPaymentStatusResponse> getPaymentStatus(
    @PathVariable Long id,
    @AuthenticationPrincipal CustomUserDetails user,
    @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId
);

// Reinicia un pago fallido para que el vendedor pueda intentar de nuevo
@PostMapping("/{id}/payment/reset")
public ResponseEntity<TicketResponse> resetPaymentAttempt(
    @PathVariable Long id,
    @AuthenticationPrincipal CustomUserDetails user
);
//   throws → 409 CONFLICT si ticket no está en PAYMENT_FAILED
```

### 11.11 `TicketConfigController` — Endpoints OAuth

```java
// Endpoints para la conexión de cuenta MP del vendedor

// Genera la URL de autorización de MP para redirigir al frontend
@GetMapping("/mercadopago/auth-url")
public ResponseEntity<Map<String, String>> getMercadoPagoAuthUrl(
    @AuthenticationPrincipal CustomUserDetails user
);
//   returns: { authUrl: "https://auth.mercadopago.com/..." }

// Procesa el callback OAuth: intercambia code → tokens, registra webhook
@PostMapping("/mercadopago/connect")
public ResponseEntity<MercadoPagoConnectResponse> connectMercadoPago(
    @RequestBody MercadoPagoConnectRequest request,  // { code, state }
    @AuthenticationPrincipal CustomUserDetails user
);
//   throws → 400 BAD_REQUEST si state inválido o expirado
//   throws → 502 BAD_GATEWAY si MP rechaza el code

// Retorna estado de conexión (publicKey si conectado, mpEnabled, mpUserId)
// NUNCA retorna access_token ni refresh_token
@GetMapping("/mercadopago/status")
public ResponseEntity<MercadoPagoConnectResponse> getMercadoPagoStatus(
    @AuthenticationPrincipal CustomUserDetails user
);

// Desconecta la cuenta: limpia tokens en BD, elimina webhook en MP
@DeleteMapping("/mercadopago")
public ResponseEntity<Void> disconnectMercadoPago(
    @AuthenticationPrincipal CustomUserDetails user
);
```

### 11.12 Manejo en `GlobalExceptionHandler` — Excepciones nuevas

```java
// Agregar al GlobalExceptionHandler existente:

@ExceptionHandler(MercadoPagoUnavailableException.class)
// → 503 SERVICE_UNAVAILABLE
// message: "El servicio de pagos no está disponible en este momento. Intentá más tarde."

@ExceptionHandler(MercadoPagoApiException.class)
// → 502 BAD_GATEWAY (si error de MP) o 400 BAD_REQUEST (si datos inválidos)
// message: Mensaje traducido del código de error de MP (ver catálogo MP)

@ExceptionHandler(MercadoPagoTokenException.class)
// → 424 FAILED_DEPENDENCY
// message: "Tu cuenta de Mercado Pago no está conectada o la conexión venció. Reconectá tu cuenta."

@ExceptionHandler(WebhookSignatureException.class)
// → 401 UNAUTHORIZED
// message: "Solicitud inválida." (genérico, no exponer por qué falló la firma)
// Log interno: WARNING con correlationId y motivo real

@ExceptionHandler(IllegalTicketStateTransitionException.class)
// → 409 CONFLICT
// message: "Esta operación no es válida para el estado actual del comprobante."

@ExceptionHandler(CryptoOperationException.class)
// → 500 INTERNAL_SERVER_ERROR
// message: "Error interno. Contactá al soporte."
// Log interno: CRITICAL — posible tampering de datos en BD
```

---

## 12. Diagrama de Componentes Completo

```mermaid
C4Context
    title Sistema KB Ventas Online — Integración Mercado Pago

    Person(vendedor, "Vendedor", "Usuario registrado con cuenta MP conectada")
    Person(comprador, "Comprador", "Cliente final del vendedor")

    System_Boundary(kb, "KB Ventas Online") {
        System(frontend, "Frontend React", "Vite 5, React 18, TailwindCSS")
        System(backend, "Backend Spring Boot", "Java 21, Spring Boot 3.3")
        SystemDb(db, "PostgreSQL", "ticket_configs, sale_tickets, mp_webhook_events")
    }

    System_Ext(mp_api, "Mercado Pago API", "api.mercadopago.com\nOAuth, Preferences, Payments, Webhooks")
    System_Ext(mp_checkout, "MP Checkout Pro", "Página de pago hosteada por MP")
    System_Ext(resend, "Resend", "Servicio de email transaccional")

    Rel(vendedor, frontend, "Conecta cuenta MP, crea tickets, ve estado de pagos")
    Rel(comprador, mp_checkout, "Ingresa datos de pago")
    Rel(frontend, backend, "REST API + JWT auth")
    Rel(backend, db, "JPA/Hibernate")
    Rel(backend, mp_api, "HTTPS REST (Circuit Breaker)")
    Rel(mp_api, backend, "Webhook IPN → /api/webhooks/mercadopago")
    Rel(mp_api, mp_checkout, "Renderiza página de pago")
    Rel(mp_checkout, comprador, "Procesa pago")
    Rel(backend, resend, "Email confirmación de pago")
    Rel(resend, comprador, "Email: Comprobante de compra")
```

```mermaid
graph TB
    subgraph "Frontend Layer"
        TicketDetail["TicketDetailPage\n(MercadoPagoButton\nPolling status)"]
        TicketConfig["TicketConfigPage\n(MercadoPagoConnect\nOAuth redirect handler)"]
    end

    subgraph "Controller Layer"
        STC["SaleTicketController\nPOST /{id}/payment/mercadopago\nGET  /{id}/payment/status\nPOST /{id}/payment/reset"]
        TCC["TicketConfigController\nGET  /mercadopago/auth-url\nPOST /mercadopago/connect\nGET  /mercadopago/status\nDEL  /mercadopago"]
        WC["WebhookController\nPOST /webhooks/mercadopago\n[Sin JWT, Rate Limited]"]
    end

    subgraph "Application Service Layer"
        MPS["MercadoPagoPaymentService\ncreatePreference()\ngetPaymentStatus()\nrefundPayment()\nconfirmPayment()\nfailPayment()"]
        MPOA["MercadoPagoOAuthService\nbuildAuthorizationUrl()\nconnectAccount()\ndisconnectAccount()"]
        STS["SaleTicketService\n(modificado)\nconfirmPayment()\nfailPayment()\nresetPaymentAttempt()"]
    end

    subgraph "Infrastructure Layer"
        MPAC["MercadoPagoApiClient\ncreatePreference()\ngetPayment()\nrefundPayment()\nregisterWebhook()"]
        WV["WebhookValidator\nvalidate()\nextractVendorUserId()"]
        TM["TokenManager\ngetValidToken()\nexchangeCode()\nrevokeLocalTokens()"]
        WP["WebhookProcessor @Async\nprocessAsync()\nhandlePaymentEvent()"]
        ESC["EncryptedStringConverter\n@Convert on mp_access_token\nmp_refresh_token\nmp_webhook_secret"]
        CB["Resilience4j\nCircuit Breaker\nRetry\nTimeLimiter"]
    end

    subgraph "Persistence Layer"
        TC[("ticket_configs")]
        ST[("sale_tickets")]
        WE[("mp_webhook_events")]
        PL[("mp_payment_log")]
    end

    TicketDetail --> STC
    TicketConfig --> TCC
    STC --> MPS
    TCC --> MPOA
    WC --> WV
    WC --> WP
    MPS --> MPAC
    MPS --> STS
    MPOA --> TM
    MPAC --> CB
    CB --> External["api.mercadopago.com"]
    TM --> TC
    ESC --> TC
    STS --> ST
    STS --> PL
    WP --> MPS
    WP --> WE
```

---

## 13. Matriz de Decisiones

| Decisión | Opción A | Opción B | **Elegida** | Razón |
|----------|----------|----------|-------------|-------|
| **Cifrado** | AES-256-CBC | AES-256-GCM | **GCM** | Autenticación de cifrado (AEAD): detecta tampering |
| **Storage de tokens MP** | Tabla separada `mp_credentials` | Extender `TicketConfig` | **TicketConfig** | Ya es 1:1 con tenant; no duplicar aislamiento |
| **Idempotencia** | Campo `processed` en `sale_tickets` | Tabla `mp_webhook_events` | **Tabla separada** | Registra intentos fallidos; soporta múltiples topics |
| **Circuit Breaker** | Sentinel | Resilience4j | **Resilience4j** | Ya tiene compatibilidad con Spring Boot Actuator; más adoptado en ecosistema Spring |
| **OAuth State** | UUID aleatorio en sesión | JWT firmado con JWT_SECRET | **JWT firmado** | Stateless; no requiere sesión; expira solo; verifica userId |
| **Retry de webhook** | En WebhookController (sync) | En WebhookProcessor (@Async + @Retryable) | **@Async + @Retryable** | Responder 200 a MP inmediatamente; reintentos internos transparentes |
| **Refund** | Automático al cancelar | Opcional al cancelar (flag refundInMp) | **Opcional** | No todos los vendedores querrán reembolsar; algunos prefieren crédito en tienda |
| **Polling de estado** | WebSocket push | Polling REST cada 3s | **Polling** | Más simple; WebSocket ya existe pero agrega complejidad sin beneficio claro para este flujo |
| **MP Checkout** | Custom Brick (embedded) | Checkout Pro (redirect/popup) | **Checkout Pro** | Sin responsabilidad PCI sobre datos de tarjeta; MP maneja la seguridad del formulario |
| **Rate Limiting** | Nginx/proxy | Bucket4j en la app | **Bucket4j** | Sin control de proxy en Render Hobby; in-app es portable |

---

## Apéndice — Variables de Entorno Requeridas

### Backend (agregar en Render)

| Variable | Descripción | Sensible | Ejemplo |
|----------|-------------|---------|---------|
| `APP_ENCRYPTION_KEY` | Clave AES-256 (32 bytes hex) | **Sí** | `openssl rand -hex 32` |
| `MP_CLIENT_ID` | Client ID de la app en MP Developers | No | `123456789` |
| `MP_CLIENT_SECRET` | Client Secret de la app MP | **Sí** | `abc123...` |
| `MP_REDIRECT_URI` | URI de callback del OAuth | No | `https://app.com/tickets/config` |
| `MP_NOTIFICATION_URL` | Base URL para webhooks (backend) | No | `https://api.app.com/api` |

### Frontend (agregar en Vercel)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_MP_OAUTH_REDIRECT` | URI de callback visible en el browser | `https://app.com/tickets/config` |

> Los `access_token` y `webhook_secret` de cada vendedor NO son variables de entorno — se guardan en BD cifrada, aislados por tenant.
