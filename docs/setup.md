# Guía de instalación — KB Gastos

## Prerrequisitos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Java | 21 | `java -version` |
| Maven | 3.8 | `mvn -version` |
| Node.js | 18 | `node -v` |
| npm | 9 | `npm -v` |
| Docker Desktop | cualquiera | `docker -v` |
| Git | cualquiera | `git -v` |

---

## 1. Configurar Git (primera vez en una PC nueva)

```bash
git config --global user.name "jpirra"
git config --global user.email "pirrajuanpablo@gmail.com"
```

## 2. Clonar el repositorio

```bash
git clone https://github.com/jppirra/kb-gastos.git
cd kb-gastos
```

---

## 2. Variables de entorno

### Backend

Copiar la plantilla y completar los valores requeridos:

```bash
cp .env.example .env
```

Valores mínimos para que el backend arranque:

```env
DB_PASSWORD=tu_password_local
JWT_SECRET=genera_uno_con_openssl_rand_hex_64
APP_BASE_URL=http://localhost:5173
```

El resto (Resend, Telegram, WhatsApp, Google) son opcionales — si no se configuran, esas funcionalidades quedan deshabilitadas pero el sistema arranca igual.

### Frontend

```bash
cp frontend/.env.example frontend/.env.local
```

Contenido mínimo:

```env
VITE_API_URL=http://localhost:8080/api
```

---

## 3. Base de datos (PostgreSQL con Docker)

```bash
# Levantar contenedor PostgreSQL 16
docker compose up -d

# Verificar que esté corriendo
docker ps

# Inicializar schema y datos de prueba
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/schema.sql
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/data.sql
```

El contenedor usa estas credenciales por defecto (configurables en docker-compose.yml):
- Host: `localhost:5432`
- DB: `kb_gastos`
- Usuario: `postgres`

---

## 4. Backend

```bash
cd backend
mvn spring-boot:run
```

Verificar que arrancó:
```
http://localhost:8080/api/health  → {"status":"ok"}
http://localhost:8080/swagger-ui.html
```

### En Windows (si Maven o Java no están en PATH)

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21..."  # ajustar al path real
$env:PATH = "C:\tools\apache-maven-3.x.x\bin;" + $env:PATH
mvn spring-boot:run
```

---

## 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en: http://localhost:5173

---

## 6. Usuarios de prueba

El archivo `database/data.sql` crea:

| Email | Contraseña | Hogar |
|---|---|---|
| juan@example.com | password123 | Casa de Prueba |
| maria@example.com | password123 | Casa de Prueba |

---

## Configuración en producción

### Backend (Render)

Variables de entorno requeridas en el dashboard de Render:

```
DB_URL=jdbc:postgresql://<host>:<port>/<db>?sslmode=require
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=<openssl rand -hex 64>
APP_BASE_URL=https://kb-gastos.jafpsoft.com
CORS_ORIGINS=https://kb-gastos.jafpsoft.com
RESEND_API_KEY=re_...
MAIL_FROM_ADDRESS=noreply@jafpsoft.com
```

### Frontend (Vercel)

Variables en el dashboard de Vercel:

```
VITE_API_URL=/api
```

El `vercel.json` ya proxea `/api/*` al backend. No exponer la URL de Render directamente.

### Dominio personalizado (Vercel)

1. Vercel → Settings → Domains → Add `kb-gastos.jafpsoft.com`
2. Porkbun DNS: agregar CNAME `kb-gastos` → valor que provea Vercel

### Email (Resend)

1. Crear cuenta en resend.com
2. Domains → Add Domain → `jafpsoft.com`
3. Agregar registros DNS que indique Resend en Porkbun
4. Una vez verificado, setear `RESEND_API_KEY` y `MAIL_FROM_ADDRESS` en Render

### Google OAuth (producción)

1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client
2. Authorized JavaScript origins: agregar `https://kb-gastos.jafpsoft.com`
3. Setear `GOOGLE_CLIENT_ID` en Render y `VITE_GOOGLE_CLIENT_ID` en Vercel

### Supabase Storage (comprobantes de viáticos)

1. Crear proyecto en supabase.com
2. Storage → New bucket → `viaticos-receipts` (Public)
3. Storage → Policies → Add policy INSERT para el bucket
4. Setear `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel

### UptimeRobot (keep-alive de Render free)

Configurar monitor HTTP:
- URL: `https://kb-gastos-backend.onrender.com/api/health`
- Keyword: `ok`
- Intervalo: 5 minutos

El endpoint ejecuta `SELECT 1` contra PostgreSQL para mantener activa tanto la instancia como la conexión a la base.

---

## Verificación de instalación completa

```bash
# Backend health (con DB check)
curl http://localhost:8080/api/health

# Login con datos de prueba
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"password123"}'

# Frontend
open http://localhost:5173
```
