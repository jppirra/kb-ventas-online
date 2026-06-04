# Tech Stack — KB Gastos

Todas las versiones son las efectivamente declaradas en `pom.xml` y `package.json`.

---

## Backend

| Tecnología | Versión | Rol |
|---|---|---|
| Java | 21 (LTS) | Lenguaje principal |
| Spring Boot | 3.3.0 | Framework base |
| Spring Security | (incluido en Boot 3.3) | Auth, CORS, filtros JWT |
| Spring Data JPA | (incluido en Boot 3.3) | ORM, repositories |
| Hibernate | (incluido en Boot 3.3) | Implementación JPA; `ddl-auto=update` |
| PostgreSQL JDBC | (runtime, via Boot) | Driver de base de datos |
| HikariCP | (incluido en Boot) | Pool de conexiones |
| JJWT | 0.12.3 | Generación y validación de JWT |
| springdoc-openapi | 2.5.0 | Swagger UI automático |
| Lombok | (opcional) | Reducción de boilerplate (getters, builders, logs) |
| Apache Commons Text | 1.12.0 | Fuzzy matching para categorización de mensajes WhatsApp |
| OpenPDF | 1.3.43 | Generación de PDF de rendiciones de viáticos |
| Spring Mail | (incluido en Boot) | Declarado en pom.xml; la implementación real usa Resend REST API directamente vía RestClient |
| Maven | 3.8+ | Build y gestión de dependencias |

### Notas de diseño

- **RestClient (Spring 6):** Se usa `RestClient.create()` para llamadas REST salientes (Resend API, WhatsApp Graph API). No hay WebClient ni Feign.
- **@Async:** Los envíos de email son fire-and-forget para no bloquear los requests del usuario.
- **No hay caché:** No se usa Redis ni cache en memoria. Cada request consulta la DB.
- **No hay mensajería:** No hay Kafka, RabbitMQ ni eventos asincrónicos más allá de `@Async` + thread pool de Spring.

---

## Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| React | 18.2.0 | UI library |
| Vite | 5.1.4 | Bundler y dev server |
| React Router DOM | 6.22.0 | Enrutamiento SPA |
| TailwindCSS | 3.4.1 | Utilidades CSS |
| Recharts | 2.12.0 | Gráficos (pie, bar, line) |
| Axios | 1.6.7 | HTTP client con interceptors |
| date-fns | 3.3.1 | Formateo de fechas |
| Sonner | 2.0.7 | Toast notifications |
| @react-oauth/google | 0.13.5 | Google Sign-In |

### Notas de diseño

- **Sin Redux / Zustand:** Estado global únicamente con React Context (AuthContext, ThemeContext). El resto es estado local por componente.
- **Sin TypeScript:** El proyecto es JavaScript puro.
- **Sin testing automatizado:** No hay Jest, Vitest ni Playwright configurados.
- **Proxy Vercel:** `vercel.json` redirige `/api/*` al backend. El frontend siempre llama a rutas relativas `/api/...`, nunca a dominios externos directamente.

---

## Base de datos

| Tecnología | Versión | Rol |
|---|---|---|
| PostgreSQL | 16 (Alpine en Docker) | Base de datos principal |

### Notas

- Schema gestionado por Hibernate (`ddl-auto=update`). No hay herramienta de migraciones (Flyway/Liquibase).
- Índices definidos en `database/schema.sql` para las consultas más frecuentes.

---

## Infraestructura y servicios externos

| Servicio | Rol |
|---|---|
| Vercel (Hobby) | Deploy frontend. Auto-deploy en push a `main` vía GitHub Actions webhook. |
| Render (Free) | Deploy backend. Auto-deploy en push a `main`. Se duerme por inactividad → UptimeRobot lo mantiene activo. |
| Resend | Emails transaccionales vía REST API HTTPS. Dominio verificado: `jafpsoft.com`. |
| Supabase Storage | Almacenamiento de comprobantes de viáticos (imágenes/PDF). Bucket público `viaticos-receipts`. |
| Google OAuth 2.0 | Sign-in con Google. Requiere origen autorizado en Google Cloud Console. |
| Porkbun | Registrador del dominio `jafpsoft.com`. DNS gestionado ahí. |
| UptimeRobot | Monitor HTTP cada 5 min para mantener activo el free tier de Render. |

---

## Bots de mensajería

| Bot | Protocolo | Estado |
|---|---|---|
| Telegram | Long polling (`getUpdates` cada 3 s via `@Scheduled`) | Activo |
| WhatsApp | Webhook Meta Cloud API + Graph API para respuestas | Activo (requiere token permanente en prod) |
