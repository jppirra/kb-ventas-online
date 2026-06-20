# Análisis de Integración — Mercado Pago
> Staff Architect Audit · Branch: `feature/mercadopago` · Target: v1.004.00 · 2026-06-20

---

## Resumen Ejecutivo

El sistema tiene una arquitectura limpia con buenas bases de seguridad. Sin embargo, existen **cuatro brechas críticas** que deben resolverse antes de procesar pagos reales: ausencia de cifrado de credenciales en reposo, ausencia de validación de firma en webhooks, ausencia de mecanismo de idempotencia y ausencia de rate limiting. Ninguna de estas brechas requiere refactors grandes — todas son adiciones puntuales sobre la arquitectura existente.

---

## 1. Estado Actual del Sistema (Puntos de Partida)

### Lo que está bien y se puede reutilizar

| Patrón existente | Dónde está | Aplicabilidad a MP |
|-----------------|-----------|-------------------|
| `RestClient.create()` + Bearer header | `EmailService`, `StorageService` | ✅ Mismo patrón para API de MP |
| `@Async` + logging en `email_logs` | `EmailService` | ✅ Reutilizar para confirmaciones de pago |
| `@Lock(PESSIMISTIC_WRITE)` en numeración | `TicketConfigRepository` | ✅ Mismo patrón para `MercadoPagoPayment` |
| `@Transactional` con rollback implícito | `SaleTicketService` | ✅ Toda operación de pago en transacción |
| `GlobalExceptionHandler` con errores genéricos | `exception/` | ✅ Agregar `MercadoPagoException` |
| `userId` del JWT en cada operación | Todos los services | ✅ Tenant isolation ya resuelto |
| `AppConfig.java` con `@EnableAsync` | `config/` | ✅ Webhooks deben ser async |
| `@Value` para inyección de credentials | `EmailService`, `StorageService` | ✅ Para credenciales MP globales |

### Lo que falta y debe construirse

| Brecha | Severidad | Esfuerzo estimado |
|--------|-----------|------------------|
| Cifrado de credenciales en BD | **CRÍTICA** | Bajo (1 JPA Converter) |
| Validación de firma webhook (HMAC-SHA256) | **CRÍTICA** | Bajo (1 método + filtro) |
| Idempotencia en webhooks | **CRÍTICA** | Medio (tabla + unique constraint) |
| Rate limiting en endpoints sensibles | **CRÍTICA** | Bajo (1 dependencia + anotación) |
| Máquina de estados explícita para tickets | ALTA | Medio (enum + validación) |
| Separación de credenciales MP (OAuth por tenant vs. app-level) | ALTA | Bajo (campos en TicketConfig) |
| Reintentos en @Async tasks de pago | MEDIA | Bajo (1 dependencia + anotación) |
| Cascade delete de `TicketConfig`/`SaleTicket` al eliminar usuario | MEDIA | Bajo (purgeUserDependencies) |

---

## 2. Estrategia de Persistencia de Credenciales OAuth por Tenant

### Contexto: ¿Cómo conecta cada vendedor su cuenta?

Mercado Pago ofrece dos modelos:

| Modelo | Descripción | Recomendado para |
|--------|-------------|-----------------|
| **Checkout con credenciales propias del vendedor** | Cada vendedor conecta su cuenta MP vía OAuth. Los cobros van directo a su cuenta. | **Este proyecto** |
| **Marketplace (split payments)** | La plataforma cobra y distribuye. Requiere acuerdo MP Marketplace. | No aplicable aquí |

El modelo correcto es el **primero**: cada vendedor configura su `access_token` personal de MP, y los pagos van directo a su cuenta. La plataforma no toca el dinero.

### Qué datos se necesitan almacenar por tenant

```
access_token      — Token de MP para hacer llamadas a la API (sensible)
refresh_token     — Para renovar el access_token cuando expire (sensible)
mp_user_id        — ID numérico del vendedor en MP (no sensible)
public_key        — Clave pública para el frontend (no sensible)
mp_enabled        — Si el vendedor activó MP como medio de pago (boolean)
mp_webhook_secret — Secret para validar firmassde webhooks (sensible)
```

### Dónde persistirlos: extender `TicketConfig`

`TicketConfig` es la entidad correcta porque:
- Ya es `1:1` con `User` (userId es la PK)
- Ya contiene configuración por tenant (AFIP, logo, métodos de pago)
- Ya tiene el patrón `findByIdForUpdate` con lock pesimista
- `TicketConfigResponse` (DTO) ya existe y puede filtrar campos sensibles

**Campos a agregar:**
```
mp_access_token        — CIFRADO en BD
mp_refresh_token       — CIFRADO en BD
mp_user_id             — PLAIN TEXT
mp_public_key          — PLAIN TEXT (va al frontend)
mp_enabled             — BOOLEAN, default false
mp_webhook_secret      — CIFRADO en BD (generado por MP al registrar webhook)
mp_token_expires_at    — TIMESTAMP (para saber cuándo renovar)
```

### Cifrado en Reposo: JPA `AttributeConverter`

El sistema actualmente **NO cifra ningún dato en BD**. Para las credenciales de MP esto es inaceptable.

**Mecanismo recomendado**: `@Convert` con `AttributeConverter<String, String>` usando AES-256-GCM.

```
Clase: EncryptedStringConverter implements AttributeConverter<String, String>
  convertToDatabaseColumn(attr) → AES-256-GCM encrypt → Base64
  convertToEntityAttribute(col) → Base64 decode → AES-256-GCM decrypt

Clave de cifrado: variable de entorno APP_ENCRYPTION_KEY (32 bytes)
```

El campo en la entidad se anota con:
```java
@Convert(converter = EncryptedStringConverter.class)
@Column(name = "mp_access_token", columnDefinition = "TEXT")
private String mpAccessToken;
```

**Ventajas sobre alternativas:**
- Transparente para el código de negocio
- No requiere Vault externo
- Compatible con `ddl-auto=update` (columna TEXT simple)
- Portable: si se migra a Vault después, solo cambia el Converter

**Alternativa futura**: HashiCorp Vault o AWS Secrets Manager cuando el volumen lo justifique.

### Flujo de Conexión OAuth

```
1. Vendedor hace clic en "Conectar cuenta de Mercado Pago"
2. Frontend redirige a: https://auth.mercadopago.com/authorization?...&redirect_uri=...
3. MP redirige a: /tickets/config?mp_code=AUTH_CODE
4. Frontend toma mp_code de query param y llama:
   POST /api/tickets/config/mercadopago { code: AUTH_CODE }
5. Backend llama a MP Token API:
   POST https://api.mercadopago.com/oauth/token { code, client_id, client_secret, redirect_uri }
6. MP responde: { access_token, refresh_token, user_id, public_key, expires_in }
7. Backend cifra y guarda en TicketConfig
8. Backend retorna al frontend: { mpEnabled: true, mpUserId, publicKey } (sin access_token)
```

### Renovación de Tokens

`access_token` de MP expira. El campo `mp_token_expires_at` permite detectarlo:

```
Patrón: Before each API call to MP, check if expires_at < now() + 5min
  → If true: call refresh endpoint, update stored tokens
  → If false: proceed normally
```

Este chequeo debe estar en un servicio de decoración (`MercadoPagoTokenRefresher`) que envuelve todas las llamadas al API de MP, no en el servicio de negocio.

---

## 3. Riesgos de Seguridad y Brechas Potenciales

### 3.1 CRÍTICO — Sin Cifrado de Credenciales en Base de Datos

**Hallazgo**: No existe ningún `AttributeConverter`, `@Encrypt` o cifrado de campos en la codebase. `AppSetting` guarda `value` como `TEXT` plain. `User.passwordHash` es la única excepción (BCrypt correcto).

**Impacto para MP**: Si la BD es comprometida (dump, acceso no autorizado al host de Render), todos los `access_token` de MP de todos los vendedores quedan expuestos. Un atacante podría iniciar pagos, solicitar reembolsos o acceder a datos financieros de sus cuentas.

**Mitigación**: `EncryptedStringConverter` (AES-256-GCM) aplicado a `mpAccessToken`, `mpRefreshToken`, `mpWebhookSecret`. La clave de cifrado vive en la variable de entorno `APP_ENCRYPTION_KEY`, nunca en código.

**Nivel de esfuerzo**: Bajo. Una clase Converter + 3 anotaciones `@Convert`.

---

### 3.2 CRÍTICO — Sin Validación de Firma en Webhooks

**Hallazgo**: `SecurityConfig` define `/api/webhooks/**` como ruta pública (sin auth). No hay ningún mecanismo de validación de firma en el código actual.

**Impacto para MP**: Sin validación HMAC, cualquier actor externo puede enviar una petición falsa a `/api/webhooks/mercadopago` con `{"type": "payment", "data": {"id": "123"}}` y simular la aprobación de un pago inexistente o manipulado. Esto podría:
- Marcar tickets como pagados sin que el cliente haya pagado
- Liberar stock de manera fraudulenta
- Disparar envíos de email de confirmación falsas

**Mecanismo de MP**: Envía el header `x-signature` con formato `ts=TIMESTAMP,v1=HMAC-SHA256(ts+body, secret)`.

**Mitigación**: Implementar `MercadoPagoWebhookValidator` que:
1. Extrae `ts` y `v1` del header `x-signature`
2. Construye el mensaje: `id:{paymentId};request-id:{requestId};ts:{ts};`
3. Calcula HMAC-SHA256 con el `mpWebhookSecret` del vendedor (buscado por `userId`)
4. Compara con timing-safe `MessageDigest.isEqual()` (previene timing attacks)
5. Verifica que `ts` no sea mayor a 5 minutos (previene replay attacks)

**Nivel de esfuerzo**: Bajo. Un componente `@Component` + anotación en el controller.

---

### 3.3 CRÍTICO — Sin Idempotencia en Procesamiento de Webhooks

**Hallazgo**: No hay ningún mecanismo de idempotencia en el sistema. `SaleTicketService` no verifica si un evento ya fue procesado antes de ejecutar cambios.

**Impacto para MP**: La documentación de MP indica explícitamente que **un mismo webhook puede llegar múltiples veces** (reintentos automáticos si no responde con 200). Sin idempotencia:
- Un pago aprobado podría actualizarse múltiples veces (race condition)
- Un email de confirmación podría enviarse N veces al cliente
- Los contadores de stock podrían ajustarse más de una vez

**Mitigación**: Tabla `mercadopago_webhook_events` con `external_payment_id` + unique constraint. Antes de procesar, hacer `INSERT OR IGNORE`. Si ya existe, responder 200 y salir.

```
mercadopago_webhook_events:
  id                BIGSERIAL PK
  external_id       VARCHAR(100) UNIQUE  — ID de pago de MP
  status            VARCHAR(20)          — received, processing, processed, failed
  raw_body          TEXT                 — para debugging
  processed_at      TIMESTAMP
  created_at        TIMESTAMP
```

**Nivel de esfuerzo**: Medio. Nueva entidad + repo + lógica en `MercadoPagoService`.

---

### 3.4 CRÍTICO — Sin Rate Limiting

**Hallazgo**: No hay `bucket4j`, `resilience4j`, ni ningún mecanismo de rate limiting en el proyecto.

**Impacto para MP**:
- El endpoint de creación de preferencias podría ser abusado (flood de preferencias → costo en API de MP)
- El endpoint de webhook podría ser atacado con flood de peticiones falsas (DoS)
- Los endpoints de configuración MP (guardar/leer access_token) podrían ser objeto de brute force

**Mitigación mínima**: Agregar `bucket4j` como dependencia y anotar endpoints críticos:
- `POST /api/tickets/*/payment/mercadopago` → 10 req/min por usuario
- `POST /api/webhooks/mercadopago` → 100 req/min por IP
- `POST /api/tickets/config/mercadopago` → 5 req/min por usuario

**Nivel de esfuerzo**: Bajo. Dependencia Maven + configuración + 3 anotaciones.

---

### 3.5 ALTA — Google OAuth sin Validación de Firma Server-Side

**Hallazgo**: `AuthService.decodeGoogleJwt()` decodifica el JWT de Google haciendo Base64 decode del payload **sin verificar la firma** contra las public keys de Google (JWKS endpoint).

**Riesgo actual**: Un atacante que conozca el formato del Google JWT podría forjar un token con cualquier email/googleId. En la práctica, esto es difícil porque el frontend usa `@react-oauth/google` que valida el token con Google antes de enviarlo, pero el backend no debería confiar ciegamente.

**Conexión con MP**: Si se reutiliza este patrón para el OAuth de MP, sería peligroso porque el `code` de autorización de MP SÍ debe intercambiarse server-to-server (lo cual es correcto) — pero si en el futuro se implementa un flujo de "token pasado desde el cliente", heredaría este problema.

**Mitigación**: Para MP OAuth no hay riesgo inmediato porque el `auth_code` se intercambia en el backend. Para Google, agregar verificación con `google-auth-library` o usar el endpoint de tokeninfo de Google.

---

### 3.6 ALTA — Máquina de Estados Implícita en SaleTicket

**Hallazgo**: `SaleTicket.status` es un `String` libre. No hay validación de transiciones permitidas. Cualquier valor puede asignarse vía `PATCH /{id}/status`.

**Impacto para MP**: Al integrar MP, el ticket tendrá estados adicionales: `PAYMENT_PENDING`, `PAYMENT_PROCESSING`, `PAYMENT_FAILED`. Si no hay una máquina de estados, puede haber transiciones inválidas:
- `CANCELLED` → `PAID` (no debería permitirse)
- `PAYMENT_PENDING` → `DRAFT` (inconsistencia)
- `PAID` → `PAYMENT_PENDING` (regresión de estado)

**Mitigación**: Definir un `enum TicketStatus` con las transiciones permitidas. La validación en el service antes de cualquier `setStatus()`.

```
Estado          → Transiciones permitidas
DRAFT           → PAID, CANCELLED, PAYMENT_PENDING
PAYMENT_PENDING → PAID, PAYMENT_FAILED, CANCELLED
PAYMENT_FAILED  → DRAFT, CANCELLED (permite reintentar)
PAID            → CANCELLED (para anulación)
CANCELLED       → (ninguna — estado final)
```

---

### 3.7 MEDIA — Tokens JWT en localStorage (XSS Risk)

**Hallazgo**: `axios.js` guarda `token` y `refreshToken` en `localStorage`. Es el patrón más común en SPAs pero es vulnerable a XSS: si un script malicioso se ejecuta en el browser, puede leer y exfiltrar ambos tokens.

**Impacto para MP**: Los tokens MP no van a localStorage (se guardan solo en backend), así que el impacto es el mismo que existe hoy: si el JWT del usuario es robado, el atacante puede operar como ese usuario y también disparar pagos con MP.

**Mitigación ideal**: `httpOnly cookies` (inmune a XSS). En la arquitectura actual requiere ajustes en CORS y en la gestión de sesión.

**Mitigación pragmática a corto plazo**: Content Security Policy (CSP) headers para reducir superficie de XSS. Implementar en Vercel (`vercel.json` headers).

---

### 3.8 MEDIA — Cascade Delete Incompleto

**Hallazgo**: `AdminService.purgeUserDependencies()` solo elimina `EmailVerificationToken`, `PasswordResetToken` y `Rating`. No purga `SaleTicket`, `TicketConfig`, `Product`, `Catalog`, `Customer`, `OrderRequest`, `MercadoPagoPayment`.

**Impacto para MP**: Si se elimina un usuario vendedor que tenía MP conectado, su `TicketConfig` con el `mpAccessToken` cifrado permanece huérfano en la BD. Los pagos pendientes en MP quedarían en estado indefinido.

**Mitigación**: Completar `purgeUserDependencies()` con todos los dependientes, en orden correcto para respetar FK constraints.

---

### 3.9 MEDIA — CORS Permite Todos los Headers

**Hallazgo**: `configuration.setAllowedHeaders(List.of("*"))` — permite cualquier header de cualquier origen configurado.

**Impacto**: Menor en el contexto actual, pero puede permitir ataques de header injection desde un origen autorizado comprometido.

**Mitigación**: Listar explícitamente: `Authorization, Content-Type, X-Requested-With`.

---

### 3.10 BAJA — `nextTicketNumber` Expuesto en `TicketConfigResponse`

**Hallazgo**: `TicketConfigResponse` incluye `nextTicketNumber`, `nextNcNumber`, `nextNdNumber`. Un competidor o atacante puede saber cuántos tickets/comprobantes ha generado cada vendedor.

**Mitigación**: Remover de `TicketConfigResponse`. No tiene uso en el frontend (solo se necesita server-side para generar el número).

---

## 4. Oportunidades de Refactor (Clean Architecture)

### 4.1 Extraer `MercadoPagoService` como servicio de infraestructura

**Problema actual**: `EmailService` y `StorageService` son servicios de infraestructura que hacen llamadas HTTP externas, pero están mezclados con lógica de negocio en el mismo package `service/`.

**Propuesta**: Crear package `infrastructure/` o `integration/`:
```
service/
  SaleTicketService.java        — lógica de negocio pura
  MercadoPagoPaymentService.java — orquestación de pagos (negocio)

integration/
  mercadopago/
    MercadoPagoApiClient.java   — llamadas HTTP a MP API
    MercadoPagoWebhookValidator.java
    MercadoPagoTokenManager.java — refresh automático de tokens
  resend/
    EmailApiClient.java         — mover de EmailService
  supabase/
    StorageApiClient.java       — mover de StorageService
```

Esto alinea con el principio de **Dependency Inversion**: el servicio de negocio depende de interfaces, no de clientes HTTP concretos. Facilita testing con mocks.

**Esfuerzo**: Medio. Refactor de package structure + extracción de la capa HTTP.

---

### 4.2 Introducir `enum TicketStatus` con validación de transiciones

**Problema actual**: `SaleTicket.status` es `String`. `updateStatus()` no valida transiciones.

**Propuesta**:
```java
public enum TicketStatus {
    DRAFT, PAYMENT_PENDING, PAYMENT_PROCESSING, PAID, PAYMENT_FAILED, CANCELLED;

    public boolean canTransitionTo(TicketStatus next) {
        return switch (this) {
            case DRAFT -> Set.of(PAYMENT_PENDING, PAID, CANCELLED).contains(next);
            case PAYMENT_PENDING -> Set.of(PAID, PAYMENT_FAILED, CANCELLED).contains(next);
            case PAYMENT_FAILED -> Set.of(DRAFT, CANCELLED).contains(next);
            case PAID -> Set.of(CANCELLED).contains(next);
            case CANCELLED, PAYMENT_PROCESSING -> false;
        };
    }
}
```

`SaleTicket.status` se mapea como `@Enumerated(EnumType.STRING)` para mantener compatibilidad con datos existentes.

**Esfuerzo**: Bajo. Enum + validación en `SaleTicketService.updateStatus()`.

---

### 4.3 `EncryptedStringConverter` como infraestructura transversal

**Problema actual**: Ningún campo se cifra. Para MP necesitamos cifrar al menos 3 campos.

**Propuesta**: Clase única `EncryptedStringConverter implements AttributeConverter<String, String>` en package `config/` o `security/`:
- Clave de 256 bits desde `APP_ENCRYPTION_KEY` (env var)
- AES-256-GCM con IV aleatorio por valor
- Null-safe: si input es null, retorna null
- Aplicable a cualquier campo con `@Convert(converter = EncryptedStringConverter.class)`

**Beneficio adicional**: Si en el futuro se decide cifrar `taxId` o `businessEmail` por compliance, el mecanismo ya existe.

**Esfuerzo**: Bajo. Una clase de ~60 líneas.

---

### 4.4 Separar `WebhookController` del `SaleTicketController`

**Problema actual**: No existen webhooks. Al agregar MP, la tentación es poner `POST /webhooks/mercadopago` en `SaleTicketController`.

**Propuesta**: Crear `WebhookController` dedicado:
```java
@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {
    // POST /mercadopago     — recibe IPN
    // POST /mercadopago/test — testing en desarrollo
}
```

**Por qué separar**: Los webhooks tienen ciclo de vida diferente (sin auth JWT, validación propia, async processing, idempotencia). Mezclarlo en `SaleTicketController` rompe el principio de responsabilidad única.

**Esfuerzo**: Mínimo. Solo estructura de packages.

---

### 4.5 Tabla `mercadopago_webhook_events` como log de idempotencia

**Propuesta de modelo**:
```
mercadopago_webhook_events:
  id                BIGSERIAL PK
  external_id       VARCHAR(100) UNIQUE NOT NULL   — "payment:{paymentId}"
  topic             VARCHAR(50)                    — "payment", "merchant_order"
  vendor_user_id    BIGINT                         — para multi-tenant
  status            VARCHAR(20)                    — received, processed, failed
  raw_body          TEXT                           — para debugging
  error_message     TEXT
  processed_at      TIMESTAMP
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
```

Este log también sirve como auditoría completa de todos los eventos recibidos de MP.

---

### 4.6 Completar `purgeUserDependencies` antes de activar pagos

Si un usuario con MP conectado es eliminado, sus pagos pendientes en MP quedan huérfanos.

**Orden de purga correcto** (respeta FK constraints):
```
1. mercadopago_webhook_events (por vendor_user_id)
2. sale_ticket_items (vía CASCADE de sale_tickets)
3. sale_tickets (por user_id)
4. mercadopago_payment (por user_id, si se crea tabla separada)
5. ticket_configs (por user_id)
6. products (por user_id)
7. catalog_collaborators (por catalog_id) → luego catalogs
8. customers (por vendor_user_id)
9. order_requests (por vendor_user_id)
10. social_links, notifications, ratings (por user_id)
11. email_verification_tokens, password_reset_tokens
12. User
```

---

### 4.7 Agregar `@Retryable` en operaciones de pago async

**Problema actual**: Los métodos `@Async` no tienen reintentos. Si el envío de email de confirmación de pago falla, se pierde.

**Propuesta**: Agregar `spring-retry` y anotar:
- `sendPaymentConfirmationEmail()` → 3 reintentos, backoff exponencial
- `updateStockAfterPayment()` → no necesita retry (es síncrono y transaccional)
- `notifyMercadoPagoPaymentConfirmed()` → 3 reintentos si el webhook processing falla

**Esfuerzo**: Bajo. Una dependencia + `@EnableRetry` en config + `@Retryable` en métodos.

---

## 5. Mapa de Cambios por Componente

### Backend — Nuevos archivos

```
model/
  MercadoPagoWebhookEvent.java      — entidad para idempotencia y log

dto/payment/
  MercadoPagoPreferenceResponse.java
  MercadoPagoWebhookDto.java
  MercadoPagoPaymentStatusResponse.java

service/
  MercadoPagoPaymentService.java    — orquesta preferencias, confirmación, stock

integration/mercadopago/
  MercadoPagoApiClient.java         — HTTP calls a api.mercadopago.com
  MercadoPagoWebhookValidator.java  — valida X-Signature
  MercadoPagoTokenManager.java      — refresh tokens cuando expiran

security/
  EncryptedStringConverter.java     — AttributeConverter AES-256-GCM

controller/
  WebhookController.java            — POST /api/webhooks/mercadopago

repository/
  MercadoPagoWebhookEventRepository.java
```

### Backend — Archivos modificados

```
model/TicketConfig.java
  + mpAccessToken (ENCRYPTED)
  + mpRefreshToken (ENCRYPTED)
  + mpUserId
  + mpPublicKey
  + mpEnabled
  + mpWebhookSecret (ENCRYPTED)
  + mpTokenExpiresAt

model/SaleTicket.java
  + mpPreferenceId
  + mpPaymentId
  + mpStatus
  + mpStatusUpdatedAt

dto/ticket/TicketResponse.java
  + mpStatus
  + mpPreferenceId (para polling frontend)
  - nextTicketNumber (remover de TicketConfigResponse)

controller/SaleTicketController.java
  + POST /{id}/payment/mercadopago
  + GET  /{id}/payment/status

security/SecurityConfig.java
  + /api/webhooks/** → permitAll (ya está)
  + Agregar headers CORS explícitos

service/SaleTicketService.java
  + sendTicketEmail: también llamar cuando mp_status=approved
  Modificar updateStatus() para validar transiciones con enum

service/AdminService.java
  Completar purgeUserDependencies() con todos los dependientes

config/AppConfig.java
  + @EnableRetry
```

### Frontend — Nuevos archivos

```
src/api/payments.js
  createMpPayment: (ticketId)   → POST /tickets/{id}/payment/mercadopago
  getMpStatus:     (ticketId)   → GET  /tickets/{id}/payment/status
  connectMp:       (code)       → POST /tickets/config/mercadopago
  disconnectMp:    ()           → DELETE /tickets/config/mercadopago
  getMpConfig:     ()           → GET /tickets/config/mercadopago (publicKey + enabled)

src/components/MercadoPagoButton.jsx
  — Botón "Pagar con Mercado Pago" que abre el link de pago
  — Muestra estado: pendiente/aprobado/rechazado

src/components/MercadoPagoConnect.jsx
  — Sección en TicketConfigPage para conectar/desconectar cuenta MP
  — Muestra mpUserId si conectado, botón OAuth si no
```

### Frontend — Archivos modificados

```
src/pages/TicketConfigPage.jsx
  + Sección MercadoPagoConnect
  + Manejar redirect de OAuth (leer mp_code de query params)

src/pages/TicketDetailPage.jsx
  + MercadoPagoButton si config.mpEnabled && ticket.total > 0
  + Polling de estado (GET /payment/status) si mpStatus = pending

src/api/tickets.js
  + getMpConfig: () → GET /tickets/config/mercadopago
```

---

## 6. Variables de Entorno Requeridas

### Backend (agregar)

| Variable | Descripción | Sensible |
|----------|-------------|---------|
| `APP_ENCRYPTION_KEY` | Clave AES-256 (32 bytes hex) para cifrar credenciales en BD | Sí |
| `MP_CLIENT_ID` | Client ID de la app registrada en MP Developers | No |
| `MP_CLIENT_SECRET` | Client Secret de la app MP | Sí |
| `MP_REDIRECT_URI` | URI de callback del OAuth de MP | No |
| `MP_NOTIFICATION_URL` | URL base para webhooks (prod: backend URL de Render) | No |

> Los `access_token` y `webhook_secret` de cada vendedor se guardan en BD cifrada, NO como env vars.

### Frontend (agregar)

| Variable | Descripción |
|----------|-------------|
| `VITE_MP_PUBLIC_KEY_TEST` | Public key de MP en modo sandbox (dev) |
| `VITE_MP_OAUTH_REDIRECT` | URI de callback OAuth visible al usuario |

---

## 7. Orden de Implementación Recomendado

### Fase 1 — Infraestructura de seguridad (bloqueante)
1. `EncryptedStringConverter` (AES-256-GCM)
2. `TicketStatus` enum + validación de transiciones
3. `MercadoPagoWebhookValidator` (HMAC-SHA256)
4. `MercadoPagoWebhookEvent` entidad + repo (idempotencia)
5. Rate limiting con `bucket4j` en endpoints MP

### Fase 2 — Conexión OAuth por tenant
6. Extender `TicketConfig` con campos MP
7. `MercadoPagoTokenManager` (OAuth code exchange + refresh)
8. `POST /api/tickets/config/mercadopago` (conectar)
9. Frontend: `MercadoPagoConnect` en TicketConfigPage

### Fase 3 — Creación de pagos
10. `MercadoPagoApiClient` (crear preferencia)
11. `MercadoPagoPaymentService.createPreference()`
12. `POST /api/tickets/{id}/payment/mercadopago`
13. Frontend: `MercadoPagoButton` en TicketDetailPage

### Fase 4 — Webhooks y confirmación
14. `WebhookController.POST /api/webhooks/mercadopago`
15. Procesamiento async: actualizar ticket, ajustar stock, enviar email
16. `GET /api/tickets/{id}/payment/status` (para polling frontend)
17. Frontend: polling de estado

### Fase 5 — Hardening y observabilidad
18. Completar `purgeUserDependencies()`
19. `@Retryable` en email de confirmación de pago
20. Remover `nextTicketNumber` de `TicketConfigResponse`
21. CSP headers en `vercel.json`
22. Tests de integración con MP sandbox

---

## 8. Tabla de Decisiones Arquitectónicas

| Decisión | Alternativa considerada | Decisión adoptada | Justificación |
|----------|------------------------|------------------|--------------|
| ¿Dónde guardar credenciales MP? | Tabla separada `mp_credentials` | Extender `TicketConfig` | Ya es 1:1 con User; no duplicar tenant context |
| ¿Cómo cifrar? | Vault externo (HashiCorp) | `EncryptedStringConverter` AES-256-GCM | Overhead de Vault innecesario en este stage |
| ¿Tabla de pagos separada? | Campos en `SaleTicket` | Tabla `mercadopago_webhook_events` para idempotencia + campos en `SaleTicket` para trazabilidad | Separar log de infraestructura del modelo de negocio |
| ¿Dónde van los webhooks? | En `SaleTicketController` | `WebhookController` separado | SRP: ciclo de vida y auth distintos |
| ¿Integrar Brick de MP o redirect? | Checkout Pro (redirect a MP) | Checkout Pro primero, Brick V2 como mejora | Más simple, sin manejar datos de tarjeta, compatible con certificación PCI |
| ¿Rate limiting? | Nginx/proxy level | `bucket4j` en la app | Sin control de proxy propio en Render Hobby |
| ¿Modelo OAuth o Simple (access_token manual)? | Conexión manual pegando access_token | OAuth por vendedor | UX correcta para SaaS; evita que el vendedor exponga su token |

---

## 9. Riesgos Residuales Aceptados

| Riesgo | Razón para aceptar | Mitigación futura |
|--------|-------------------|------------------|
| Tokens JWT en localStorage | Patrón establecido, cambio costoso | CSP headers + evaluación de httpOnly cookies en v2 |
| Google OAuth sin verificación de firma | Riesgo bajo en práctica (client lib valida) | Agregar verificación con JWKS en hardening futuro |
| `ddl-auto=update` en prod | Simplicidad de deploy en Render Hobby | Mitigar con columnas siempre nullable en nuevas migraciones |
| Pool DB limitado (max 5) | Restricción de tier Render Hobby | @Async para webhooks; optimizar queries; upgrade de tier si escala |

---

## Conclusión

La arquitectura actual soporta la integración de Mercado Pago sin refactors estructurales mayores. Las cuatro brechas críticas (cifrado, HMAC webhook, idempotencia, rate limiting) son **adiciones puntuales** de baja a media complejidad que deben implementarse en la Fase 1 antes de tocar cualquier lógica de negocio. El modelo multi-tenant existente (`userId` en `TicketConfig`) es exactamente el mecanismo correcto para escalar la integración a múltiples vendedores sin ningún cambio conceptual.

**Próximo paso**: Implementar Fase 1 (infraestructura de seguridad) comenzando por `EncryptedStringConverter`.
