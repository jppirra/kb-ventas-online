# Patrones reutilizables — Kit de arranque para proyectos nuevos

Qué copiar de KB Gastos para arrancar un proyecto nuevo con la misma base técnica
(Spring Boot + React + PostgreSQL + Resend + Vercel/Render).

---

## Archivos a copiar directamente (sin modificar)

| Archivo | Para qué sirve |
|---|---|
| `CLAUDE.md` | Reglas de Claude Code — adaptar nombre del proyecto y stack |
| `.gitleaks.toml` | Escaneo de secretos en commits |
| `docs/git-workflow.md` | Estándar de commits y ramas |
| `docs/secrets-checklist.md` | Checklist de seguridad |
| `docs/best-practices.md` | Convenciones de código |
| `setup-dev.bat` / `setup-dev.sh` | Scripts de primer arranque |
| `docker-compose.yml` | PostgreSQL local (cambiar nombre del servicio/DB) |

---

## Archivos a copiar y adaptar

| Archivo | Qué adaptar |
|---|---|
| `.env.example` | Agregar/quitar variables según las integraciones del nuevo proyecto |
| `database/schema.sql` | Reemplazar tablas del dominio, conservar patrón de `users`, `tokens` |
| `frontend/vercel.json` | Cambiar URL del backend en el proxy |

---

## Patrones de seguridad y autenticación

Estos son los módulos más costosos de implementar desde cero. Copiarlos y adaptar los nombres del dominio.

### 1. Login / Registro / JWT

**Backend — clases a copiar:**

| Clase | Ubicación | Qué hace |
|---|---|---|
| `JwtTokenProvider` | `security/` | Genera y valida tokens JWT (access + refresh) |
| `JwtAuthenticationFilter` | `security/` | Intercepta cada request y carga el contexto de seguridad |
| `UserDetailsServiceImpl` | `security/` | Adapter entre Spring Security y la entidad User |
| `SecurityConfig` | `config/` | Define rutas públicas vs protegidas, CORS, política de sesión stateless |
| `AuthController` | `controller/` | Endpoints: register, login, refresh, forgot-password, reset-password, verify-email |
| `AuthService` | `service/` | Lógica de registro, login, generación de tokens, verificación |

**Flujo de autenticación:**
```
POST /api/auth/register
  → crea User (emailVerified=false)
  → genera EmailVerificationToken (24h)
  → envía email de verificación con link {APP_BASE_URL}/verify-email?token=...
  → devuelve AuthResponse (token + refreshToken)

POST /api/auth/login
  → valida email/password
  → genera token JWT (1h) + refreshToken (7d)
  → devuelve AuthResponse

POST /api/auth/refresh
  → valida refreshToken
  → genera nuevo token JWT
  → devuelve AuthResponse

GET /api/auth/verify-email?token=...
  → marca User.emailVerified=true
  → invalida el token usado

POST /api/auth/forgot-password
  → genera PasswordResetToken (24h)
  → envía email con link {APP_BASE_URL}/reset-password?token=...

POST /api/auth/reset-password
  → valida token + nueva password
  → actualiza User.password
  → invalida el token usado
```

**JWT — estructura del token:**
- `userId` — id del usuario
- `householdId` — id del hogar activo (puede ser null si aún no tiene)
- `sub` — email del usuario
- `iat` / `exp` — emitido / expira

El `userId` y `householdId` se extraen del token en cada request. Nunca del body.

**Frontend — archivos a copiar:**

| Archivo | Qué hace |
|---|---|
| `src/api/axios.js` | Instancia Axios con interceptor de 401 → refresh automático → reintento |
| `src/context/AuthContext.jsx` | Estado global de sesión (token, user, logout, storeUser) |
| `src/components/ProtectedRoute.jsx` | Guard de rutas autenticadas |
| `src/pages/Login.jsx` | Formulario de login + Google OAuth |
| `src/pages/Register.jsx` | Formulario de registro |
| `src/pages/ForgotPassword.jsx` | Solicitud de reset de password |
| `src/pages/ResetPassword.jsx` | Formulario de nueva password con token |
| `src/pages/VerifyEmail.jsx` | Pantalla de verificación de email |

**Flujo de tokens en el frontend:**
```
Login exitoso
  → guarda token + refreshToken en localStorage
  → AuthContext expone el estado de sesión

Cada request
  → axios interceptor adjunta Bearer token

Request devuelve 401
  → axios interceptor llama POST /api/auth/refresh con refreshToken
  → si ok: guarda nuevo token, reintenta el request original
  → si falla: limpia localStorage, redirige a /login

Logout
  → limpia localStorage (conserva theme y currency)
  → redirige a /login
```

---

### 2. Google OAuth

**Backend:** `AuthController.POST /api/auth/google` — recibe el `idToken` del frontend, lo verifica con Google y devuelve un AuthResponse.

**Frontend:** `@react-oauth/google` — `<GoogleOAuthProvider clientId={...}>` en `App.jsx`, botón `<GoogleLogin onSuccess={...}>` en Login.jsx.

**Configuración:** Registrar el origen del frontend en Google Cloud Console → Authorized JavaScript Origins.

---

### 3. Email transaccional (Resend)

**Backend — clase a copiar:** `EmailService.java`

Patrón de envío:
```java
private void send(String toEmail, String subject, String type, String html) {
    Map<String, Object> body = new HashMap<>();
    body.put("from", fromName + " <" + fromEmail + ">");
    body.put("to", List.of(toEmail));
    body.put("subject", subject);
    body.put("html", html);

    RestClient.create()
        .post()
        .uri("https://api.resend.com/emails")
        .header("Authorization", "Bearer " + resendApiKey)
        .contentType(MediaType.APPLICATION_JSON)
        .body(body)
        .retrieve()
        .toBodilessEntity();
}
```

**Por qué Resend y no SMTP:** Render free tier bloquea todos los puertos SMTP (25, 465, 587). Resend usa HTTPS (443), nunca bloqueado.

**Tipos de email implementados:**
- Verificación de cuenta (`sendVerificationEmail`)
- Reset de password (`sendPasswordResetEmail`)
- Invitación a hogar (`sendInvitationEmail`)
- Invitación a empresa (`sendCompanyInvitationEmail`)
- Notificación de nuevo miembro (`sendJoinNotificationEmail`)
- Rendición enviada a aprobador (`sendTripSubmittedEmail`)
- Estado de rendición al colaborador (`sendTripStatusEmail`)
- Envío de PDF con adjunto (`sendTripPdfEmail`)
- Email de prueba desde admin (`sendTestEmail`)

**Variables de entorno requeridas:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@tudominio.com  # debe ser dominio verificado en Resend
APP_BASE_URL=https://tuapp.com           # se usa en los links de los emails
```

---

### 4. Manejo global de errores

**Backend — clase a copiar:** `GlobalExceptionHandler.java`

Captura excepciones no manejadas y las transforma en respuestas JSON consistentes:
- `IllegalArgumentException` → 400
- `ResponseStatusException` → código HTTP que lleva el exception
- `Exception` genérica → 500

**Frontend — patrón del interceptor en axios.js:**
```javascript
// 400/401 → manejados por cada formulario con su propio estado de error
// 500 → toast.error automático desde el interceptor
// Sin conexión → toast.error "Sin conexión con el servidor"
```

---

### 5. Proxy Vercel (ocultar URL del backend)

```json
// frontend/vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://tu-backend.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

El frontend siempre llama a `/api/...`. Vercel lo redirige al backend. La URL de Render nunca se expone en el navegador.

Variable en Vercel: `VITE_API_URL = /api`

---

### 6. Health check con verificación de DB

```java
// HealthController.java
@GetMapping("/api/health")
public ResponseEntity<Map<String, String>> health() {
    jdbcTemplate.queryForObject("SELECT 1", Integer.class);
    return ResponseEntity.ok(Map.of("status", "ok"));
}
```

Sirve para UptimeRobot (keep-alive en Render free) y para verificar que la DB responde.

---

## Checklist para nuevo proyecto

- [ ] Copiar archivos de la tabla "sin modificar"
- [ ] Adaptar `CLAUDE.md` (nombre del proyecto)
- [ ] Crear nuevo repo en GitHub
- [ ] Crear proyecto en Vercel, conectar al repo
- [ ] Crear servicio en Render, conectar al repo
- [ ] Crear proyecto en Supabase (si hay file storage)
- [ ] Registrar dominio y agregar DNS en proveedor
- [ ] Crear cuenta Resend, verificar dominio, obtener API key
- [ ] Configurar Google Cloud Console (si hay OAuth)
- [ ] Setear todas las variables de entorno en Render y Vercel
- [ ] Configurar UptimeRobot apuntando al `/api/health`
- [ ] Agregar origen del dominio en Google Cloud Console
- [ ] Generar `JWT_SECRET` con `openssl rand -hex 64`
