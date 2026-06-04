# Secrets y Variables de Entorno — KB Gastos

## Archivos que NUNCA deben commitear

El `.gitignore` ya los excluye, pero verificar siempre:

```
.env
.env.local
.env.production
backend/src/main/resources/application-prod.properties
*.p12
*.jks
```

## Variables del Backend

### Requeridas (el backend no arranca sin ellas)

| Variable | Ejemplo | Cómo obtener |
|---|---|---|
| `DB_PASSWORD` | `mySecurePass123` | Definir al crear la DB |
| `JWT_SECRET` | `openssl rand -hex 64` | Generar con openssl |

### Requeridas para funcionalidad completa

| Variable | Ejemplo | Dónde configurar |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://host:5432/kb_gastos` | Proveedor PostgreSQL |
| `DB_USERNAME` | `postgres` | Proveedor PostgreSQL |
| `APP_BASE_URL` | `https://kb-gastos.jafpsoft.com` | URL del frontend en producción |
| `CORS_ORIGINS` | `https://kb-gastos.jafpsoft.com` | URL del frontend |

### Opcionales (funcionalidades específicas)

| Variable | Servicio | Notas |
|---|---|---|
| `RESEND_API_KEY` | Resend | Emails. Sin esto no se envían emails. |
| `MAIL_FROM_ADDRESS` | Resend | `noreply@jafpsoft.com` — debe ser dominio verificado en Resend |
| `GOOGLE_CLIENT_ID` | Google Cloud | OAuth. Sin esto no funciona "Sign in with Google" |
| `TELEGRAM_BOT_TOKEN` | Telegram BotFather | Sin esto el bot de Telegram no arranca |
| `TELEGRAM_BOT_ENABLED` | — | `true`/`false`. Default `true`. |
| `WHATSAPP_VERIFY_TOKEN` | Meta | Secreto para validar webhook |
| `WHATSAPP_API_TOKEN` | Meta Graph API | Token de acceso (rotar antes de que expire) |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta | ID del número de WhatsApp |
| `WHATSAPP_SUPPORT_PHONE` | — | Número de soporte para usuarios no registrados |
| `APP_ADMIN_EMAIL` | — | Email que se promueve a app admin al iniciar |

## Variables del Frontend

| Variable | Req | Valor en producción | Valor local |
|---|---|---|---|
| `VITE_API_URL` | Sí | `/api` | `http://localhost:8080/api` |
| `VITE_SUPABASE_URL` | No | URL del proyecto Supabase | igual |
| `VITE_SUPABASE_ANON_KEY` | No | Anon key de Supabase (es pública, pero no commitear) | igual |
| `VITE_GOOGLE_CLIENT_ID` | No | Mismo que el backend | igual |

> **Nota:** Las variables `VITE_*` se embeben en el bundle JS y son visibles para cualquier usuario. Nunca poner secretos en variables VITE_.

## Checklist antes de subir a producción

- [ ] `JWT_SECRET` generado con `openssl rand -hex 64` (mín. 32 chars)
- [ ] `DB_PASSWORD` no es el valor por defecto
- [ ] `APP_BASE_URL` apunta al dominio real (no localhost)
- [ ] `CORS_ORIGINS` contiene solo los dominios del frontend
- [ ] `VITE_API_URL` en Vercel = `/api` (sin URL de Render expuesta)
- [ ] `RESEND_API_KEY` es la key activa (no la que se compartió en chat)
- [ ] Dominio `jafpsoft.com` verificado en Resend con registros DKIM/SPF
- [ ] Origen `https://kb-gastos.jafpsoft.com` registrado en Google Cloud Console
- [ ] Supabase bucket `viaticos-receipts` tiene política INSERT para anon
- [ ] `.env` y `.env.local` están en `.gitignore`
- [ ] No hay secretos hardcodeados en el código

## Gestión de secretos por entorno

| Entorno | Dónde se guardan |
|---|---|
| Local | `.env` (gitignored) |
| Backend producción | Render → Environment Variables |
| Frontend producción | Vercel → Settings → Environment Variables |

## Rotación recomendada

| Secret | Frecuencia | Motivo |
|---|---|---|
| `WHATSAPP_API_TOKEN` | Antes de que expire (~24h tokens temporales) | Meta invalida tokens temporales |
| `JWT_SECRET` | Si se sospecha compromiso | Invalida todas las sesiones activas |
| `RESEND_API_KEY` | Si se expone accidentalmente | Rotar en resend.com dashboard |
