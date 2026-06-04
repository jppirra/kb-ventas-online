# Claude Rules — KB Gastos
# Directivas de trabajo para Claude Code en este proyecto.
# Basadas en preferencias explícitas del usuario documentadas durante el desarrollo.

## COMPORTAMIENTO GENERAL

- Ejecutar comandos directamente sin pedir confirmación previa (bash, git, npm, mvn).
- Al terminar una tarea de desarrollo, siempre hacer commit y push a producción.
- Respuestas cortas y directas. Sin resúmenes de lo que se hizo al final de cada respuesta.
- No usar emojis salvo que el usuario lo pida.

## IDENTIDAD GIT

- Autor de todos los commits: `jpirra <pirrajuanpablo@gmail.com>`
- Verificar antes de commitear en una PC nueva:
  ```
  git config user.name "jpirra"
  git config user.email "pirrajuanpablo@gmail.com"
  ```

## COMMITS

- NUNCA incluir `Co-Authored-By: Claude` en mensajes de commit.
  Razón: rompe el auto-deploy de Vercel Hobby en repositorios privados.
- Formato de commit: `<tipo>: <descripción en minúsculas sin punto final>`
- Tipos: feat, fix, refactor, docs, chore.
- Nunca usar `git add -A` ni `git add .` en bulk. Agregar archivos específicos.
- Nunca usar `--no-verify` para saltear hooks.
- Nunca hacer force-push a main.

## CÓDIGO BACKEND (Spring Boot / Java)

- Stack: Spring Boot 3.3, Java 21, Maven, PostgreSQL, Lombok.
- El userId y householdId SIEMPRE se extraen del JWT, nunca del request body.
- Validaciones de acceso van en el Service, no en el Controller.
- Los emails son siempre @Async (fire-and-forget), excepto sendTestEmail.
- Emails van por Resend REST API (no SMTP). Render free bloquea todos los puertos SMTP.
- Configuración dinámica (subjects, colores, URLs) se lee de la tabla app_config.
- En DataMigration, los seeds son idempotentes (solo insertan si no existe).
- Nunca exponer entidades JPA directamente. Usar DTOs.

## CÓDIGO FRONTEND (React)

- Stack: React 18, Vite 5, TailwindCSS 3, React Router v6.
- Todas las llamadas HTTP usan la instancia `api` de `src/api/axios.js`.
- URLs siempre relativas: `/expenses`, `/api/categories`. Nunca hardcodear dominios.
- El VITE_API_URL en producción es `/api` (Vercel proxea al backend).
- Variables VITE_ son públicas. No poner secretos.
- Errores de API: `toast.error(err.response?.data?.message || 'Mensaje genérico en español')`.
- Modales de confirmación para acciones destructivas.
- Sin Redux. Estado global solo con React Context.

## SEGURIDAD

- Nunca hardcodear secretos en el código ni en application.properties.
- Toda credencial va en variables de entorno.
- Verificar roles en frontend Y backend (defensa en profundidad).
- Supabase: solo usar anon key en el frontend, nunca service_role key.

## IDIOMA

- UI de la app: español (Argentina). Mensajes de error, labels, botones: español.
- Código (variables, métodos, comentarios): inglés o español, ser consistente dentro del archivo.
- Documentación técnica (/docs): español.

## ESTRUCTURA DEL PROYECTO

- Backend: /backend (Spring Boot Maven)
- Frontend: /frontend (React Vite)
- Base de datos: /database (PostgreSQL schema + seeds)
- Documentación: /docs
- No crear archivos de documentación extra fuera de /docs salvo README.md en la raíz.

## LO QUE NO HACER

- No agregar features no solicitadas.
- No refactorizar código que no es parte de la tarea.
- No agregar manejo de errores para casos que no pueden ocurrir.
- No agregar comentarios que explican QUÉ hace el código (los nombres lo hacen).
- No agregar Co-Authored-By en commits (ya documentado arriba, es crítico).
- No preguntar antes de ejecutar comandos de desarrollo (ya documentado arriba).
