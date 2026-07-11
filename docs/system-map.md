# System Map — KB Ventas Online
> Staff Architect Survey · Branch: `feature/mercadopago` · v1.003.27 · 2026-06-20

---

## 1. Visión General

**Qué es**: Plataforma SaaS de catálogos de ventas con módulo de facturación (AFIP-compatible). Modelo multi-tenant: cada vendedor es un usuario aislado.

**Stack**:

| Capa | Tecnología |
|------|-----------|
| Backend | Spring Boot 3.3, Java 21, Maven |
| Frontend | React 18, Vite 5, TailwindCSS 3, React Router v6 |
| Base de datos | PostgreSQL (Hibernate/JPA, `ddl-auto=update`) |
| Auth | JWT (jjwt 0.12.3) + Google OAuth |
| Email | Resend REST API (`@Async`) |
| Storage | Supabase Storage (REST) |
| AI | Gemini 2.0 Flash Lite (principal) → OpenRouter (fallback) → Anthropic |
| Deploy | Frontend → Vercel · Backend → Render.com |

---

## 2. Estructura del Repositorio

```
kb-ventas-online/
├── backend/
│   └── src/main/java/com/jafpsoft/ventas/
│       ├── config/          SecurityConfig, AppConfig, WebSocketConfig
│       ├── controller/      ~20 REST controllers
│       ├── service/         ~25 services
│       ├── model/           ~24 entidades JPA
│       ├── dto/             Request / Response DTOs (nunca exponer entidades)
│       ├── repository/      ~23 Spring Data JPA repos
│       └── security/        JwtFilter, CustomUserDetails, SecurityConfig
├── frontend/
│   └── src/
│       ├── pages/           ~42 páginas/vistas
│       ├── components/      Componentes reutilizables
│       ├── context/         AuthContext, ThemeContext
│       ├── api/             ~16 módulos Axios
│       └── utils/           track.js, helpers
├── docs/
│   └── system-map.md        ← este archivo
└── scripts/
    └── sync-version.js
```

---

## 3. Tenant Context (Aislamiento por Usuario) — CRÍTICO

### Patrón implementado: **User-ID explícito en cada query**

No existe ningún filtro global Hibernate ni discriminador de tenant en JPA. El aislamiento es manual y explícito en cada service:

```java
// Patrón universal en todos los services
private SaleTicket findOwned(Long id, Long userId) {
    return ticketRepository.findByIdAndUserId(id, userId)
        .orElseThrow(() -> new EntityNotFoundException("No encontrado"));
}
```

### Origen del userId

1. El JWT incluye `userId` como claim.
2. `JwtAuthenticationFilter` valida el token y puebla el `SecurityContext`.
3. `CustomUserDetails.getUserId()` es inyectado por Spring en cada controller:

```java
@GetMapping("/{id}")
public TicketResponse get(@PathVariable Long id,
                          @AuthenticationPrincipal CustomUserDetails user) {
    return service.getById(id, user.getUserId()); // userId siempre del JWT
}
```

### Regla de oro del proyecto

> **`userId` SIEMPRE del JWT, NUNCA del request body.** Validaciones de acceso siempre en el Service.

### Entidades con tenant isolation

| Entidad | Campo de tenant |
|---------|----------------|
| `SaleTicket` | `userId` |
| `Product` | `userId` |
| `Catalog` | `userId` |
| `TicketConfig` | `userId` (es la PK) |
| `Customer` | `vendorUserId` |
| `OrderRequest` | `vendorUserId` |
| `Store` | `userId` |
| `Notification` | `userId` |

---

## 4. Modelo de Datos

### 4.1 Entidades Core

#### `users`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | BIGSERIAL PK | |
| `email` | VARCHAR UNIQUE | |
| `password_hash` | VARCHAR | |
| `name` | VARCHAR | |
| `google_id` | VARCHAR UNIQUE | OAuth |
| `is_app_admin` | BOOLEAN | default false |
| `email_verified` | BOOLEAN | default false |
| `enabled` | BOOLEAN | default true |
| `slug` | VARCHAR UNIQUE | perfil público `/p/:slug` |
| `bio` | TEXT | |
| `profile_image_url` | VARCHAR | |
| `banner_image_url` | VARCHAR | |
| `brand_color_primary` | VARCHAR(7) | default #2563eb |
| `brand_color_secondary` | VARCHAR(7) | default #7c3aed |
| `whatsapp_number` | VARCHAR | |
| `last_access_at` | TIMESTAMP | actualizado por LastAccessFilter |
| `stock_report_frequency` | VARCHAR | WEEKLY / MONTHLY / NONE |
| `created_at` | TIMESTAMP | inmutable |

#### `sale_tickets`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | BIGSERIAL PK | |
| `user_id` | BIGINT | tenant FK |
| `ticket_number` | VARCHAR | único por (user_id, ticket_number) |
| `tipo_doc` | VARCHAR(10) | `COMP` / `NC` / `ND` |
| `reference_ticket_number` | VARCHAR(30) | para NC/ND referenciando COMP original |
| `customer_name` | VARCHAR | |
| `customer_dni` | VARCHAR(20) | |
| `customer_phone` | VARCHAR | |
| `customer_email` | VARCHAR | |
| `customer_notes` | TEXT | |
| `subtotal` | NUMERIC(12,2) | |
| `discount` | NUMERIC(12,2) | |
| `total` | NUMERIC(12,2) | |
| `payment_method` | VARCHAR | "Efectivo", "Transferencia", etc. |
| `status` | VARCHAR(20) | `DRAFT` / `PAID` / `CANCELLED` |
| `cancellation_reason` | TEXT | obligatorio al anular |
| `notes` | TEXT | |
| `created_at` | TIMESTAMP | inmutable |
| `updated_at` | TIMESTAMP | |
| **UNIQUE** | | `(user_id, ticket_number)` |

#### `sale_ticket_items`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | BIGSERIAL PK | |
| `ticket_id` | BIGINT FK | CASCADE DELETE |
| `product_id` | BIGINT | referencia (nullable) |
| `product_name` | VARCHAR | |
| `product_sku` | VARCHAR | |
| `size` | VARCHAR(30) | |
| `color` | VARCHAR(50) | |
| `quantity` | INTEGER | |
| `unit_price` | NUMERIC(12,2) | |
| `subtotal` | NUMERIC(12,2) | quantity × unit_price |
| `sort_order` | INTEGER | |

#### `ticket_configs`
| Campo | Tipo | Notas |
|-------|------|-------|
| `user_id` | BIGINT PK | 1:1 con users |
| `business_name` | VARCHAR | nombre del negocio |
| `business_address` | VARCHAR | |
| `business_phone` | VARCHAR | |
| `business_email` | VARCHAR | |
| `tax_id` | VARCHAR | CUIT |
| `logo_url` | VARCHAR | |
| `currency` | VARCHAR(10) | default `$` |
| `payment_methods` | VARCHAR | lista de métodos disponibles |
| `footer` | TEXT | pie de página en comprobantes |
| `show_catalog_qr` | BOOLEAN | default false |
| `next_ticket_number` | INTEGER | autoincremenal COMP |
| `next_nc_number` | INTEGER | autoincremental NC |
| `next_nd_number` | INTEGER | autoincremental ND |
| `tipo_comprobante` | VARCHAR(2) | `A` / `B` / `C` (AFIP) — default `B` |
| `punto_venta` | INTEGER | AFIP, nullable |
| `condicion_iva` | VARCHAR(60) | |
| `ingresos_brutos` | VARCHAR(30) | |
| `inicio_actividades` | VARCHAR(20) | |

#### `products`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | BIGSERIAL PK | |
| `user_id` | BIGINT | tenant |
| `catalog_id` | BIGINT FK | nullable |
| `active` | BOOLEAN | |
| `name` | VARCHAR | |
| `description` | TEXT | |
| `ai_description` | TEXT | generada por IA |
| `price` | NUMERIC | |
| `offer_price` | NUMERIC | nullable |
| `sku` | VARCHAR | |
| `category` | VARCHAR | |
| `image_url` | VARCHAR | |
| `stock_count` | INTEGER | |
| `show_stock` | BOOLEAN | |
| `show_stock_quantity` | BOOLEAN | |
| `show_when_out_of_stock` | BOOLEAN | |
| `variants_json` | TEXT | JSON array |
| `product_sizes` | TEXT | JSON array tallas |
| `product_colors` | TEXT | JSON array colores |
| `stock_matrix` | TEXT | JSON talla×color |
| `extra_images_json` | TEXT | gallery URLs |
| `video_url` | TEXT | |

#### `catalogs`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | BIGSERIAL PK | |
| `user_id` | BIGINT | tenant |
| `public_id` | VARCHAR(36) UNIQUE | UUID para URL pública `/c/:publicId` |
| `name` | VARCHAR | |
| `status` | VARCHAR | `DRAFT` / `GENERATING` / `GENERATED` |
| `active` | BOOLEAN | soft-delete |
| `view_mode` | VARCHAR(20) | `GRID` / `LIST` |
| `sizes_enabled` / `colors_enabled` | BOOLEAN | variantes |
| `discount` | INTEGER | % descuento global |
| `published_at` | TIMESTAMP | |
| `published_snapshot_json` | TEXT | snapshot publicado (productos + config) |
| `has_draft_changes` | BOOLEAN | hay cambios desde última publicación |
| `view_count` | BIGINT | |

#### `customers`
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | BIGSERIAL PK | |
| `vendor_user_id` | BIGINT | tenant |
| `name` | VARCHAR(100) | |
| `dni` | VARCHAR(20) | |
| `phone` | VARCHAR(30) | |
| `email` | VARCHAR(150) | |
| `notes` | TEXT | |
| `source` | VARCHAR(30) | `manual` / `order_request` |
| `order_id` | BIGINT | referencia OrderRequest |
| UNIQUE | | `(vendor_user_id, order_id)` |

### 4.2 Entidades Secundarias

| Entidad | Tabla | Propósito |
|---------|-------|-----------|
| `OrderRequest` | `order_requests` | Pedidos desde catálogos públicos |
| `Store` | `stores` | Tienda con slug propio |
| `EmailLog` | `email_logs` | Auditoría de emails (SUCCESS/FAILED) |
| `EmailVerificationToken` | `email_verification_tokens` | Tokens de verificación |
| `PasswordResetToken` | `password_reset_tokens` | Tokens de reset |
| `AppSetting` | `app_settings` | Configuración global key-value |
| `Notification` | `notifications` | Notificaciones in-app por userId |
| `Rating` | `ratings` | Calificaciones de catálogos |
| `CatalogCollaborator` | `catalog_collaborators` | Colaboradores con permisos granulares |
| `ModerationLog` | `moderation_logs` | Acciones de admins sobre usuarios |
| `UserEvent` | `user_events` | Eventos de analytics por userId |
| `BackgroundTemplate` | `background_templates` | Templates de fondo para catálogos |
| `ContactMessage` | `contact_messages` | Mensajes del formulario /contact |
| `SocialLink` | `social_links` | Links sociales por userId |
| `Rubro` | `rubros` | Categorías de negocio |

### 4.3 AppSetting (configuración global)

Tabla `app_settings` — key/value store:

| Key | Uso |
|-----|-----|
| `email.from_name` | Nombre del emisor en emails |
| `email.primary_color` | Color primario en templates de email |
| `email.verification.subject` | Asunto del email de verificación |
| `email.verification.cta_text` | Texto del botón CTA |

> No existe actualmente ninguna clave relacionada con Mercado Pago.

---

## 5. Flujo de Autenticación

```
[Usuario] → POST /api/auth/register
              ↓
          Crea User (passwordHash BCrypt)
          Genera EmailVerificationToken
          Envía email verificación @Async
              ↓
         GET /api/auth/verify-email?token=...
              ↓
          User.emailVerified = true
          Retorna AuthResponse (accessToken + refreshToken)

[Usuario] → POST /api/auth/login
          → Valida password + emailVerified
          → Genera JWT (userId, email, expiration)
          → Genera refreshToken
          → AuthResponse { accessToken, refreshToken, user }

[Google]  → POST /api/auth/google { credential }
          → Decodifica Google JWT → { email, name, picture, googleId }
          → findByGoogleId OR findByEmail → crea si no existe
          → Genera JWT interno → AuthResponse

[Refresh] → POST /api/auth/refresh { refreshToken }
          → Valida refreshToken
          → Emite nuevo accessToken
          → AuthResponse
```

### JWT Claims
```json
{
  "sub": "usuario@email.com",
  "userId": 42,
  "iat": 1234567890,
  "exp": 1234571490
}
```

### CustomUserDetails (expuesto a todos los controllers)
```java
Long userId          // campo principal para tenant isolation
String email         // username Spring Security
boolean enabled
List<GrantedAuthority> authorities // ROLE_USER | ROLE_ADMIN
```

### SecurityConfig — Rutas públicas
```
/api/auth/**           → sin auth
/api/public/**         → sin auth
/api/health            → sin auth
/ws/**                 → sin auth (validado por WebSocketAuthInterceptor)
/api/webhooks/**       → sin auth [punto de enganche para MP IPN]
/api/**                → authenticated
```

---

## 6. Endpoints REST

### Auth `/api/auth`
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/register` | — | Registro email+password |
| POST | `/login` | — | Login → JWT |
| POST | `/refresh` | — | Refresh access token |
| POST | `/google` | — | Login/Registro con Google |
| GET | `/verify-email?token` | — | Verifica email |
| POST | `/forgot-password` | — | Envía reset link |
| POST | `/reset-password` | — | Resetea password |
| POST | `/resend-verification` | — | Reenvía verificación |
| POST | `/accept-terms` | JWT | Acepta TyC |

### Tickets `/api/tickets`
| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | JWT | Lista tickets del usuario |
| GET | `/{id}` | JWT | Detalle de ticket |
| POST | `/` | JWT | Crear ticket/NC/ND |
| PATCH | `/{id}/status` | JWT | Cambiar estado |
| PATCH | `/{id}/cancel` | JWT | Anular (con motivo) |
| POST | `/{id}/send-email` | JWT | Enviar comprobante por email |
| PATCH | `/{id}/customer` | JWT | Editar datos del comprador |
| DELETE | `/{id}` | JWT | Eliminar ticket |
| GET | `/config` | JWT | Obtener TicketConfig |
| PUT | `/config` | JWT | Guardar TicketConfig |
| POST | `/config/upload-logo` | JWT | Subir logo |

### Products `/api/products`
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/` | Lista productos del usuario |
| POST | `/` | Crear producto |
| PUT | `/{id}` | Actualizar producto |
| DELETE | `/{id}` | Eliminar producto |
| POST | `/{id}/upload-image` | Subir imagen principal |
| POST | `/{id}/upload-gallery-image` | Subir imagen galería |

### Catalogs `/api/catalogs`
| Método | Path | Descripción |
|--------|------|-------------|
| GET/POST | `/` | Lista / Crear catálogo |
| GET/PUT/DELETE | `/{id}` | Detalle / Actualizar / Borrar (soft) |
| POST | `/{id}/publish` | Publicar snapshot |
| POST | `/{id}/revert` | Revertir a versión publicada |
| POST | `/{id}/generate` | Generar contenido AI @Async |
| POST | `/{id}/upload` | Importar Excel de productos |
| PUT | `/{id}/products/reorder` | Reordenar productos |
| GET | `/{id}/owner-stock` | Stock del dueño del catálogo |
| GET | `/{id}/preview` | Preview antes de publicar |
| ... | | + endpoints de imágenes, backgrounds, covers |

### Customers `/api/customers`
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/` | Lista clientes del vendedor |
| POST | `/` | Crear cliente |
| PUT | `/{id}` | Actualizar cliente |
| DELETE | `/{id}` | Eliminar cliente |

### Profile `/api/profile`
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/` | Perfil del usuario autenticado |
| PUT | `/` | Actualizar perfil |
| POST | `/upload-image` | Foto de perfil |
| POST | `/upload-banner` | Banner |

### Admin `/api/admin/**`
Todos requieren `ROLE_ADMIN`. Cubren: users, catalogs, emails, backgrounds, orders, reports, diagnostics, settings, NPS, contact, analytics, rubros.

### Public `/api/public/**`
Sin autenticación. Catálogos por `publicId`, perfiles por `slug`, explorer.

### Webhooks `/api/webhooks/**`
Sin autenticación (validados por firma). Actualmente vacío — **punto de enganche para MP IPN**.

---

## 7. Ciclo de Vida de un Ticket

### Estados
```
DRAFT → (editable, aún no cobrado)
  ↓  PATCH /{id}/status {status: "PAID"}
PAID  → (cerrado, confirmado)
  ↓  PATCH /{id}/cancel {reason: "..."}
CANCELLED → (anulado, stock revertido, número no reutilizado)
```

### Flujo de creación
```
POST /api/tickets  { tipoDoc, items[], customerX, paymentMethod, discount }
  ↓
1. Obtiene TicketConfig (con @Lock PESSIMISTIC_WRITE para numerar)
2. Asigna número correlativo según tipoDoc:
   - COMP → nextTicketNumber++
   - NC   → nextNcNumber++
   - ND   → nextNdNumber++
3. Formatea ticketNumber: "B 0001-00000001" | "NC B 0001-00000001" | "T-0001"
4. Guarda SaleTicket + items
5. adjustStock(items, delta, userId):
   - NC:       delta = +1 (devolución)
   - ND/COMP:  delta = -1 (venta)
6. Retorna TicketResponse
```

### Numeración
- Lock pesimista en `ticket_configs` previene race conditions
- El número nunca se reutiliza aunque el ticket se cancele
- Secuencias independientes: COMP / NC / ND

### Stock Adjustment Pattern
```java
void adjustStock(items, delta, userId) {
    for (item : items) {
        Product p = productRepo.findByIdAndUserId(item.productId, userId);
        if (p.isShowStockQuantity() && p.getStockCount() != null) {
            p.setStockCount(p.getStockCount() + delta * item.quantity);
        }
    }
}
```

---

## 8. Frontend — Páginas y Rutas

### Rutas Públicas
| Path | Componente | Descripción |
|------|-----------|-------------|
| `/` | RootRedirect | → /dashboard o landing |
| `/login` `/register` | Auth pages | |
| `/forgot-password` `/reset-password` | | |
| `/verify-email` | | |
| `/p/:slug` | PublicProfilePage | Perfil público vendedor |
| `/c/:catalogId` | PublicCatalogPage | Catálogo público |
| `/s/:storeSlug` | StorePage | Tienda pública |
| `/explorer` | ExplorarPage | Directorio vendedores |
| `/contact` `/terms` | | |

### Rutas Autenticadas
| Path | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard` | Dashboard | Estadísticas principales |
| `/catalogs` | CatalogsPage | Lista catálogos |
| `/catalogs/:id` | CatalogDetailPage | Editor de catálogo |
| `/stock` | StockPage | Gestión de stock |
| `/customers` | CustomersPage | Clientes con DNI |
| `/tickets` | TicketsPage | Lista tickets/facturas + filtros |
| `/tickets/:id` | TicketDetailPage | Detalle + NC/ND/Email/WA |
| `/tickets/config` | TicketConfigPage | Configuración AFIP |
| `/orders` | OrdersPage | Pedidos de catálogos |
| `/collaborators` | CollaboratorsPage | |
| `/locales` | LocalesPage | |
| `/settings` | SettingsPage | |

### Rutas Admin
`/admin/**` → protegidas por `AdminProtectedRoute` (`user.appAdmin === true`)

### Gestión de Sesión (AuthContext)
- Tokens guardados en `localStorage`
- Axios interceptor detecta 401 → intenta refresh → si falla, logout
- `user` object contiene: `id`, `email`, `name`, `appAdmin`, `profileImageUrl`, etc.
- `ThemeContext` → dark/light mode persistido en localStorage

### Módulos API Frontend
```
src/api/
├── axios.js          base config + interceptores + auto-refresh
├── auth.js           login, register, verify, refresh, OAuth
├── tickets.js        CRUD tickets, config, send-email, upload-logo
├── products.js       CRUD + upload
├── catalogs.js       CRUD + publish + AI + imports
├── customers.js      CRUD clientes
├── orders.js         list, get, update
├── profile.js        get, update, uploads
├── admin.js          todos los endpoints admin
├── dashboard.js      stats
├── settings.js       app settings
├── collaborators.js  invites y permisos
├── stores.js         CRUD tiendas
├── notifications.js  in-app notifications
├── ratings.js        calificaciones
├── contact.js        formulario de contacto
└── reports.js        reportes
```

---

## 9. Configuración y Variables de Entorno

### Backend (env vars)
| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_URL` | JDBC URL PostgreSQL | localhost:5432/my_app |
| `DB_USERNAME` / `DB_PASSWORD` | Credenciales DB | |
| `JWT_SECRET` | HMAC-SHA secret | — |
| `JWT_EXPIRATION` | ms accessToken | 3600000 (1h) |
| `JWT_REFRESH_EXPIRATION` | ms refreshToken | 604800000 (7d) |
| `CORS_ORIGINS` | Origins permitidos | localhost:5173 |
| `RESEND_API_KEY` | API key Resend | |
| `MAIL_FROM_ADDRESS` | From email | onboarding@resend.dev |
| `APP_BASE_URL` | URL frontend | http://localhost:5173 |
| `APP_BACKEND_URL` | URL backend | http://localhost:8080 |
| `GOOGLE_CLIENT_ID` | OAuth Google | |
| `APP_ADMIN_EMAILS` | Emails con ROLE_ADMIN | pirrajuanpablo@gmail.com,... |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Storage | |
| `SUPABASE_BUCKET` | Bucket imágenes | catalog-images |
| `GEMINI_API_KEY` | AI principal | |
| `OPENROUTER_API_KEY` | AI fallback | |
| `ANTHROPIC_API_KEY` | AI alternativo | |
| `PORT` | Puerto servidor | 8080 |
| `HIKARI_MAX_POOL` | Pool DB max | 5 |

### Frontend (Vite env)
| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | `/api` en prod (Vercel proxy) |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Google |

---

## 10. Integraciones Existentes

### Email — Resend REST API
- Todos los métodos son `@Async` → no bloquean el hilo HTTP
- Logs en `email_logs` (tipo, estado, error)
- `AdminService` tiene `POST /admin/email/send` (genérico HTML)
- `SaleTicketService` tiene `sendTicketEmail()` → genera HTML del comprobante

### Storage — Supabase Storage
- Usado por: productos, catálogos (backgrounds, covers), perfiles, logos de tickets
- Retorna URL pública directa

### WebSocket — STOMP sobre SockJS
- `/ws` endpoint (público, validado por `WebSocketAuthInterceptor`)
- Usado para notificaciones en tiempo real (progreso generación AI, etc.)

### AI — Multi-provider con fallback
1. Gemini 2.0 Flash Lite (principal)
2. OpenRouter gratuito (fallback)
3. Anthropic Claude Haiku (alternativo)

---

## 11. Patrones Arquitectónicos

| Patrón | Implementación |
|--------|---------------|
| **Tenant isolation** | userId del JWT en cada query del service |
| **DTO** | Nunca exponer entidades JPA; `from(entity)` estático en cada Response |
| **Service-layer transactions** | `@Transactional` en services, no en controllers |
| **Async email** | `@Async` en EmailService; log en email_logs |
| **Soft delete** | Catálogos: `active=false`; Tickets cancelados: `status=CANCELLED` |
| **Pessimistic lock** | `@Lock(PESSIMISTIC_WRITE)` al numerar tickets (previene duplicados) |
| **JWT stateless** | No sesiones; access token 1h + refresh 7d |
| **Auto-refresh JWT** | Interceptor Axios: 401 → POST /auth/refresh → reintenta |
| **Stock adjustment** | `adjustStock(items, delta, userId)`: +1 NC/cancel, -1 COMP/ND |
| **Config per tenant** | `TicketConfig` con userId como PK; se crea al primer acceso |

---

## 12. Diseño para Integración Mercado Pago

### Puntos de enganche identificados

#### Backend

**1. `TicketConfig` — agregar credenciales MP por tenant**
```
+ mp_access_token VARCHAR     (token del vendedor en MP)
+ mp_public_key   VARCHAR     (clave pública para front)
+ mp_enabled      BOOLEAN     (si el vendedor activó MP)
```

**2. `SaleTicket` — agregar trazabilidad de pagos**
```
+ mp_preference_id VARCHAR    (ID de preferencia creada en MP)
+ mp_payment_id    VARCHAR    (ID de pago confirmado)
+ mp_status        VARCHAR    (pending / approved / rejected / cancelled)
```

**3. Nuevo `MercadoPagoService`**
```
createPreference(ticket, config) → preferenceId + init_point URL
getPaymentStatus(paymentId)      → estado desde API MP
processWebhook(body, signature)  → valida firma + actualiza ticket
```

**4. Nuevos endpoints**
```
POST /api/tickets/{id}/payment/mercadopago → crea preferencia → retorna {initPoint}
GET  /api/tickets/{id}/payment/status      → consulta estado pago
POST /api/webhooks/mercadopago             → IPN webhook [public, validar X-Signature]
```

> El path `/api/webhooks/**` ya existe como público en SecurityConfig.

**5. `TicketConfigController`**
```
PUT /api/tickets/config/mercadopago → guardar credenciales MP del vendedor
```

#### Frontend

**6. `TicketDetailPage`**
- Botón "Pagar con Mercado Pago" (si `config.mpEnabled`)
- Redirige a `initPoint` o abre el wallet en iframe

**7. `TicketConfigPage`**
- Sección para conectar cuenta de Mercado Pago (access token)

**8. `ticketsApi.js`**
```
createMpPayment: (id) => api.post(`/tickets/${id}/payment/mercadopago`)
getMpStatus:     (id) => api.get(`/tickets/${id}/payment/status`)
saveMpConfig:    (data) => api.put('/tickets/config/mercadopago', data)
```

### Flujo propuesto
```
[Vendedor configura MP] → PUT /tickets/config/mercadopago { accessToken }
                          → Se guarda en TicketConfig.mpAccessToken

[Ticket PAID] → "Pagar con MP" → POST /tickets/{id}/payment/mercadopago
                → Backend crea preferencia en MP REST API con:
                  items = ticket.items, payer = ticket.customer, back_urls
                → Retorna { initPoint }
                → Frontend redirige a initPoint

[MP cobra] → Webhook POST /webhooks/mercadopago { data.id, type }
           → Backend valida X-Signature
           → GET https://api.mercadopago.com/v1/payments/{id}
           → Actualiza ticket: mpPaymentId, mpStatus, status=PAID

[Polling fallback] → GET /tickets/{id}/payment/status → { mpStatus }
```

### Consideraciones de seguridad
- `mpAccessToken` del vendedor se guarda en `ticket_configs` (ya aislado por tenant)
- Webhook MP usa `X-Signature` header → validar con HMAC-SHA256 + secret del vendedor
- No almacenar datos de tarjeta → todo pasa por MP
- `initPoint` es la URL segura de MP; no procesar pagos directamente

---

## 13. Dependencias Clave

### Backend (pom.xml)
| Dependencia | Versión | Uso |
|------------|---------|-----|
| spring-boot-starter-web | 3.3.0 | REST API |
| spring-boot-starter-security | 3.3.0 | Auth + CORS |
| spring-boot-starter-data-jpa | 3.3.0 | ORM |
| spring-boot-starter-websocket | 3.3.0 | Notificaciones RT |
| postgresql | runtime | Driver JDBC |
| jjwt-api / jjwt-impl | 0.12.3 | JWT |
| lombok | 1.18.x | Boilerplate reduction |
| springdoc-openapi-ui | 2.5.0 | API docs /swagger-ui |
| apache-poi | 5.3.0 | Importar Excel |

### Frontend (package.json)
| Dependencia | Versión | Uso |
|------------|---------|-----|
| react / react-dom | 18.2.0 | UI |
| react-router-dom | 6.22.0 | Routing |
| axios | 1.6.7 | HTTP + interceptores |
| tailwindcss | 3.4.1 | Estilos |
| @react-oauth/google | 0.13.5 | Google OAuth |
| sonner | 2.0.7 | Toasts |
| sockjs-client + @stomp/stompjs | 1.6.1 / 7.3.0 | WebSocket |
| recharts | 3.8.1 | Gráficos dashboard |
| date-fns | 3.3.1 | Formateo fechas |

---

## 14. Resumen Ejecutivo

**Fortalezas del sistema actual para la integración MP:**

- Tenant isolation robusto — cada vendedor tendrá sus propias credenciales MP aisladas en `TicketConfig`
- Webhook path `/api/webhooks/**` ya configurado como público en SecurityConfig
- Email infrastructure lista para enviar confirmación de pago
- `SaleTicket` tiene `paymentMethod` y `status` PAID/CANCELLED — el estado MP se integra limpiamente
- Patrón DTO establecido — agregar campos MP sin romper respuestas existentes
- Stock adjustment desacoplado — se puede invocar al confirmar pago MP sin cambiar la lógica

**Riesgos identificados:**

- `ddl-auto=update` en producción (Render) — columnas nuevas `NOT NULL` pueden romper deploy si hay datos existentes → siempre usar `nullable=true` en columnas nuevas
- Pool de conexiones limitado (max 5 en Render Hobby) — el webhook MP puede generar picos; usar `@Async` y optimizar queries
- `mpAccessToken` sensible — encriptar en reposo si el plan de seguridad lo requiere (actualmente todo va en claro en la DB)

**Versión base de la integración**: `v1.004.00` (nuevo hito) en rama `feature/mercadopago`.
