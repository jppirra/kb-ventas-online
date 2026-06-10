# [PROJECT NAME] — Instrucciones para Claude Code

## Identidad git

- Nombre: `jpirra`
- Email: `pirrajuanpablo@gmail.com`

## Comportamiento general

- Ejecutar comandos directamente sin pedir confirmación previa.
- Al terminar una tarea de desarrollo, siempre hacer commit y push.
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

## Código

- Todos los comentarios en el código deben estar en castellano.

## Lo que NO hacer

- No agregar features no solicitadas.
- No agregar `Co-Authored-By: Claude` (crítico).
- No preguntar antes de ejecutar comandos.
