# JAFPSoft Spring + React Template

Template de proyecto full-stack listo para usar. Incluye autenticación completa, emails, Google OAuth y proxy de API.

**Stack:** Spring Boot 3.3 (Java 21) + React 18 + Vite + TailwindCSS + PostgreSQL

## Lo que viene incluido

### Backend
- JWT auth (access + refresh token)
- Registro con verificación de email
- Login con email/contraseña y Google OAuth
- Recuperación de contraseña
- Reenvío de verificación
- Email service con Resend REST API
- GlobalExceptionHandler en español
- Health check con SELECT 1 (para UptimeRobot)
- SecurityConfig con CORS configurable
- Swagger UI en `/swagger-ui.html`

### Frontend
- Páginas listas: Login, Register, ForgotPassword, ResetPassword, VerifyEmail, Dashboard
- AuthContext con auto-refresh de token (interceptor Axios)
- ThemeContext (dark/light mode)
- ProtectedRoute
- Proxy Vercel (`/api/*` → backend)

## Inicio rápido

```bash
# 1. Clonar
git clone https://github.com/jppirra/jafpsoft-spring-react-template.git my-project
cd my-project

# 2. Configurar
cp .env.example .env           # completar DB_PASSWORD y JWT_SECRET
cp frontend/.env.example frontend/.env.local

# 3. Base de datos
docker compose up -d
docker exec -i my-app-db psql -U postgres -d my_app < database/schema.sql

# 4. Backend
cd backend && mvn spring-boot:run

# 5. Frontend
cd frontend && npm install && npm run dev
```

O usar el script: `setup-dev.bat` (Windows) / `setup-dev.sh` (Unix)

## Personalización obligatoria antes de usar

1. **`backend/pom.xml`**: cambiar `groupId`, `artifactId`, `name`
2. **`backend/src/main/java/com/template/`**: renombrar package `com.template` → `com.tuempresa.tuapp`
3. **`backend/src/main/resources/application.properties`**: cambiar `spring.application.name`
4. **`frontend/index.html`**: cambiar `<title>`
5. **`frontend/vercel.json`**: cambiar `YOUR-BACKEND.onrender.com` por la URL real
6. **`docker-compose.yml`**: cambiar `my-app-db` y `my_app` por el nombre de tu proyecto
7. **`CLAUDE.md`**: actualizar nombre del proyecto

## Docs técnica

Ver carpeta [`/docs`](./docs/) para arquitectura, setup completo, patrones de seguridad y más.

---

Template por [JAFPSoft.com](https://jafpsoft.com)

## Versión

**v1.000.08**

> Fuente de versión: editar este archivo y correr `cd frontend && npm run sync-version` para propagar al build.
