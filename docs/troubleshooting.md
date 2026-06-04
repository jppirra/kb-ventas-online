# Troubleshooting — KB Gastos

Errores reales encontrados durante el desarrollo y sus soluciones documentadas.

---

## Backend

### Error de compilación: `cannot find symbol — class Map`

**Síntoma:**
```
error: cannot find symbol
    public Map<String, String> sendTestEmail(...)
```

**Causa:** Faltaba `import java.util.Map` en `EmailService.java`.

**Solución:** Agregar el import explícito. El wildcard `java.util.*` no siempre funciona con Lombok.

---

### Email no llega — `MailConnectException: Couldn't connect to host, port: smtp.gmail.com, 587`

**Síntoma:**
```
MailConnectException: Couldn't connect to host, port: smtp.gmail.com, 587; timeout -1
```
o con timeout configurado:
```
MailSendException: nested exception: SocketTimeoutException: Connect timed out
```

**Causa:** Render free tier bloquea todos los puertos SMTP salientes (25, 465, 587). No es configurable.

**Solución:** Migrar de JavaMailSender/SMTP a Resend REST API (HTTPS, nunca bloqueado). Ver `EmailService.java`.

---

### Link de verificación de email apunta a `localhost`

**Síntoma:** El email de verificación contiene `http://localhost:5173/verify-email?token=...` en lugar del dominio de producción.

**Causa:** La tabla `app_config` tiene el registro `app.base_url` con valor `http://localhost:5173` desde el primer deploy (valor default del seed). El env var `APP_BASE_URL` se setea después pero el registro de DB ya existe y tiene precedencia.

**Solución:** `DataMigration.java` actualiza el registro si todavía apunta a localhost usando el env var actual:

```java
if (cfg.getValue().startsWith("http://localhost")) {
    cfg.setValue(appBaseUrl);
    configRepository.save(cfg);
}
```

También ejecutable manualmente en la DB:
```sql
UPDATE app_config SET value = 'https://kb-gastos.jafpsoft.com' WHERE key = 'app.base_url';
```

---

### Frontend llama a `localhost:8080` en producción

**Síntoma:** En producción, todas las llamadas de la API van a `http://localhost:8080/api/...` en lugar del backend real.

**Causa:** `VITE_API_URL` no está configurado en Vercel. El fallback de `axios.js` es `http://localhost:8080/api`.

**Solución:** En Vercel → Environment Variables → agregar:
```
VITE_API_URL = /api
```

El `vercel.json` proxea `/api/*` al backend automáticamente.

---

### `new row violates row-level security policy` al subir comprobante

**Síntoma:** Error 403 de Supabase al intentar subir un archivo al bucket `viaticos-receipts`.

**Causa:** El bucket `viaticos-receipts` no tiene política RLS de INSERT configurada.

**Solución:** Supabase → Storage → Policies → VIATICOS-RECEIPTS → New policy:
- Operation: INSERT
- Target roles: (vacío = todos)
- WITH CHECK: `bucket_id = 'viaticos-receipts'`

---

### Error de Google OAuth: `origin_mismatch`

**Síntoma:**
```
Error 400: origin_mismatch
Acceso bloqueado: error de autorización
```

**Causa:** El dominio del frontend cambió (ej: de `kb-gastos.vercel.app` a `kb-gastos.jafpsoft.com`) pero no se actualizó en Google Cloud Console.

**Solución:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID → Authorized JavaScript origins → agregar el nuevo dominio.

---

### `new row violates row-level security policy` — resumen

**Síntoma:** POST a `/api/households` devuelve 404 con `{"message":"El recurso solicitado no existe."}`.

**Causa:** El `OnboardingWizard.jsx` llamaba a `/households` en vez de `/households/init`.

**Solución:** Corregir la URL en el componente.

---

### Categorías sin botones de editar/eliminar en Settings

**Síntoma:** Las categorías se muestran pero sin los íconos de lápiz y tacho.

**Causa:** El campo `household` de la entidad `Category` tiene `@JsonIgnore`, por lo que `cat.household` en el frontend es siempre `undefined`. La condición `{cat.household && (...)}` nunca se cumple.

**Solución:** Mostrar los botones para todas las categorías (el backend valida la pertenencia en el DELETE/PUT). La verificación de propiedad la hace el backend.

---

### Bot de Telegram: el polling no funciona si `TELEGRAM_BOT_TOKEN` es vacío

**Síntoma:** El backend arranca pero lanza errores silenciosos en el polling de Telegram.

**Causa:** `TelegramBotService` intenta polling incluso si el token está vacío.

**Solución:** Setear `TELEGRAM_BOT_ENABLED=false` en Render si no se usa el bot, o configurar el token correctamente.

---

## Frontend

### Modo dark no persiste entre sesiones

El modo se guarda en `localStorage` vía `ThemeContext`. Si el storage es limpiado (logout completo o modo incógnito), vuelve al default (light).

---

### Las rendiciones aprobadas "desaparecen" de la lista

**Síntoma:** Una rendición enviada y aprobada no aparece en la vista de Viáticos.

**Causa más común:** El usuario está en el filtro "Enviado" y la rendición se movió al estado "Aprobado". El filtro activo oculta las de otros estados.

**Solución:** Los tabs ahora muestran un contador `(n)` y los tabs vacíos se ocultan. Usar el tab "Todas" para ver el estado real.

---

## Base de datos

### `init.sh` no funciona con Docker

**Síntoma:** El contenedor de Docker arranca pero la DB no se inicializa.

**Causa histórica:** El `init.sh` original estaba escrito para SQL Server (usaba `sqlcmd` y `/opt/mssql`). El `docker-compose.yml` usa PostgreSQL.

**Solución:** `init.sh` fue reescrito para usar `psql` y `pg_isready`. Ver `database/init.sh` actualizado.

Para inicializar manualmente:

```bash
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/schema.sql
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/data.sql
```
