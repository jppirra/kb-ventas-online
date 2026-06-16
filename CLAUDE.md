# [PROJECT NAME] — Instrucciones para Claude Code

## Identidad git

- Nombre: `jpirra`
- Email: `pirrajuanpablo@gmail.com`

## Comportamiento general

- Ejecutar comandos directamente sin pedir confirmación previa.
- **SIEMPRE** hacer commit y push al terminar cualquier cambio, sin excepción. La única excepción es que el usuario lo indique explícitamente.
- Respuestas cortas y directas.
- No usar emojis salvo que el usuario lo pida.

## Commits

- **NUNCA** incluir `Co-Authored-By: Claude` — rompe el auto-deploy de Vercel Hobby en repos privados.
- Formato: `<tipo>: <descripción en minúsculas sin punto final>`
- Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`
- Agregar archivos específicos, nunca `git add -A` o `git add .`

## Stack

- **Backend:** Spring Boot 3.3, Java 21, Maven, PostgreSQL, Lombok
- **Frontend:** React 18, Vite 5, TailwindCSS 3, React Router v6
- **Email:** Resend REST API (no SMTP)
- **Package base:** `com.template` → renombrar a `com.tuempresa.tuapp`

## Reglas de backend

- `userId` siempre del JWT, nunca del request body.
- Validaciones de acceso en el Service.
- Emails siempre `@Async`.
- Nunca exponer entidades JPA directamente — usar DTOs.

## Reglas de frontend

- Todas las llamadas HTTP usan `src/api/axios.js`.
- URLs siempre relativas: `/auth/login`, no `http://localhost:8080/api/auth/login`.
- `VITE_API_URL` en producción = `/api` (Vercel proxea).
- Errores al usuario en español.

## Versionado

- Formato: `vX.xxx.xx` con sufijo opcional `.xf` para fixes — ejemplo: `v1.002.01`
- El campo de versión para mostrar está en `frontend/package.json` → campo `appVersion` (no `version`, que debe mantenerse como semver válido para npm).
- También actualizar `app.version` en `backend/src/main/resources/application.properties`.
- **Cambio mayor** (módulo nuevo, refactor grande): incrementar tercer segmento `xxx` — ej. `v1.002.01` → `v1.003.00`
- **Mejora o feature pequeña**: incrementar último segmento `xx` en +01 — ej. `v1.002.00` → `v1.002.01`
- **Fix**: agregar o incrementar sufijo `.xf` sobre la versión base — ej. `v1.002.01` → `v1.002.01.1f`, luego `v1.002.01.2f`
- Al finalizar cada mensaje de respuesta, mostrar la versión actual.
- La versión se incluye en el commit junto con los demás cambios.

## Lo que NO hacer

- No agregar features no solicitadas.
- No agregar `Co-Authored-By: Claude` (crítico).
- No preguntar antes de ejecutar comandos.
