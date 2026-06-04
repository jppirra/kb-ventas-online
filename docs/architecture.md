# Arquitectura — KB Gastos

## Visión general

Arquitectura cliente-servidor clásica con tres capas principales: frontend SPA en Vercel, backend REST en Render, base de datos PostgreSQL. El frontend nunca expone la URL del backend al navegador gracias al proxy de Vercel.

```
Browser
  │
  ├── GET /dashboard, /transactions, etc.
  │     └── Vercel CDN → index.html (SPA)
  │
  └── POST /api/expenses, etc.
        └── Vercel Rewrite (/api/*) → Render backend
                └── Spring Boot → PostgreSQL
```

---

## Estructura de carpetas

```
kb-gastos/
├── backend/                          # Spring Boot (Maven)
│   └── src/main/java/com/kbgastos/
│       ├── config/                   # SecurityConfig, DataMigration, JwtConfig, OpenApiConfig, StartupValidation, WhatsAppConfig
│       ├── controller/               # 14 REST controllers
│       ├── dto/                      # DTOs organizados por dominio (auth, budget, dashboard, expense, household, viaticos, admin, ...)
│       ├── exception/                # GlobalExceptionHandler
│       ├── model/                    # 22 entidades JPA
│       ├── repository/               # 21 Spring Data JPA repositories
│       ├── security/                 # JwtTokenProvider, JwtAuthenticationFilter, UserDetailsServiceImpl
│       └── service/                  # 17 servicios de negocio
│   └── src/main/resources/
│       └── application.properties   # Configuración externalizada vía env vars
│   └── Dockerfile                   # Multi-stage: Maven build → JRE 21 Alpine runtime
│
├── frontend/                         # React 18 + Vite
│   ├── src/
│   │   ├── api/                      # axios.js (instancia + interceptors), viaticos.js
│   │   ├── components/               # 8 componentes reutilizables
│   │   ├── context/                  # AuthContext, ThemeContext
│   │   ├── pages/                    # 18 páginas
│   │   └── utils/                    # currencies.js, supabaseStorage.js
│   ├── vercel.json                   # Proxy /api/* + SPA fallback
│   └── .env.example
│
├── database/
│   ├── schema.sql                    # DDL completo
│   ├── data.sql                      # Seeds de prueba
│   └── init.sh                       # Script de inicialización para Docker (PostgreSQL)
│
├── docs/                             # Documentación técnica y manuales
├── docker-compose.yml                # PostgreSQL 16-alpine para desarrollo local
├── .env.example                      # Referencia de todas las variables de entorno
└── .gitleaks.toml                    # Reglas de detección de secretos en commits
```

---

## Capas del backend

### Patrón: Controller → Service → Repository

```
HTTP Request
    │
    ▼
Controller          Valida auth (JWT filter), extrae userId/householdId del token,
                    delega al Service. No contiene lógica de negocio.
    │
    ▼
Service             Lógica de negocio, validaciones de acceso (requireMember, requireRole),
                    construye DTOs, llama a EmailService/@Async para efectos secundarios.
    │
    ▼
Repository          Spring Data JPA. Queries custom con @Query cuando los métodos
                    derivados no alcanzan.
    │
    ▼
PostgreSQL
```

### Seguridad por capas

1. **JwtAuthenticationFilter** — intercepta cada request, valida el Bearer token y carga el contexto de seguridad.
2. **SecurityConfig** — define qué rutas son públicas (`/api/auth/**`, `/api/health`, webhooks).
3. **Service-level authorization** — cada service verifica rol antes de ejecutar (ej: `companyService.requireRole(company, user, Role.OWNER)`).
4. **Extracción de contexto desde el token** — `householdId` y `userId` se leen del JWT, no del request body, para evitar spoofing.

---

## Capas del frontend

### Rutas (React Router v6)

```
App.jsx
  ├── /login, /register, /forgot-password, /reset-password, /verify-email, /join  → públicas
  └── Layout (sidebar + header)
        ├── /dashboard
        ├── /transactions
        ├── /budget
        ├── /reports
        ├── /settings
        ├── /notifications
        ├── /admin                    → solo app admins
        └── /viaticos/**             → módulo empresarial
```

### Estado global

| Context | Responsabilidad |
|---|---|
| `AuthContext` | token, refreshToken, userId, householdId, userName, email, telegramLinked, appAdmin — persiste en localStorage |
| `ThemeContext` | dark/light mode — persiste en localStorage |

### Comunicación con el backend

- `src/api/axios.js` — instancia Axios con interceptor de request (adjunta Bearer token) e interceptor de response (refresca token en 401, muestra toast en 5xx).
- `src/api/viaticos.js` — funciones específicas del módulo empresarial.
- Todas las llamadas van a `/api/*` relativo — Vercel lo proxea al backend en Render.

---

## Base de datos

**Motor:** PostgreSQL 16

### Tablas principales

| Tabla | Descripción |
|---|---|
| `users` | Usuarios con household_id, telegram_id, whatsapp_phone, color |
| `households` | Grupos familiares |
| `household_members` | Relación user-household con rol (ADMIN/MEMBER) |
| `household_invitations` | Códigos de invitación con expiración |
| `categories` | Categorías de gastos; household_id NULL = globales, con household = propias del hogar |
| `expenses` | Gastos con currency, source (WEB/TELEGRAM/WHATSAPP) |
| `incomes` | Ingresos |
| `budgets` | Límite por categoría+mes; UNIQUE(household_id, category_id, month) |
| `companies` | Empresas del módulo viáticos |
| `company_members` | Relación user-company con rol (OWNER/APPROVER/COLLABORATOR) |
| `company_invitations` | Códigos de invitación empresarial con expiración |
| `trips` | Rendiciones de viáticos |
| `trip_expenses` | Gastos de una rendición con comprobante URL |
| `trip_categories` | Categorías específicas de empresa |
| `telegram_sessions` | Estado de la conversación del bot (state machine) |
| `email_logs` | Historial de emails enviados con status y error |
| `app_config` | Configuración dinámica key-value (editable desde admin panel) |
| `notifications` | Notificaciones in-app |

### Estrategia de schema

`spring.jpa.hibernate.ddl-auto=update` — Hibernate actualiza el schema automáticamente al iniciar. En producción esto es aceptable para este proyecto porque:
- No hay equipos separados de DB
- Los cambios se validan antes de deploy
- No hay migraciones destructivas automatizadas

---

## Integraciones externas

| Servicio | Uso | Protocolo |
|---|---|---|
| Resend | Emails transaccionales (verificación, invitaciones, reset, viáticos) | REST API HTTPS — nunca SMTP |
| Supabase Storage | Comprobantes de viáticos (fotos/PDF) | REST API con anon key |
| Google OAuth | Sign-in con Google | OAuth 2.0 implicit flow via @react-oauth/google |
| Telegram Bot API | Bot de gastos y gestión de hogar | Long polling (getUpdates cada 3s) |
| WhatsApp Cloud API | Webhook para mensajes entrantes | Meta webhook + Graph API |

---

## Flujo de despliegue

```
git push → main
  │
  ├── GitHub Actions: curl VERCEL_DEPLOY_HOOK → Vercel build + deploy
  │
  └── Render: auto-deploy on push (conectado directamente al repo GitHub)
              → Docker build (Dockerfile multi-stage)
              → java -jar app.jar
```
