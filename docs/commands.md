# Comandos frecuentes — KB Gastos

## Backend (Maven)

```bash
# Levantar en modo desarrollo
cd backend
mvn spring-boot:run

# Build sin tests
mvn package -DskipTests

# Build completo con tests
mvn package

# Limpiar y recompilar
mvn clean package -DskipTests

# Ver dependencias
mvn dependency:tree
```

---

## Frontend (npm)

```bash
cd frontend

# Instalar dependencias
npm install

# Servidor de desarrollo (hot reload)
npm run dev

# Build de producción
npm run build

# Preview del build de producción localmente
npm run preview
```

---

## Docker / Base de datos

```bash
# Levantar PostgreSQL en background
docker compose up -d

# Ver logs del contenedor
docker logs kb-gastos-db

# Ver estado de los contenedores
docker ps

# Detener el contenedor (sin eliminar datos)
docker compose stop

# Eliminar el contenedor y sus datos
docker compose down -v

# Conectarse a la DB interactivamente
docker exec -it kb-gastos-db psql -U postgres -d kb_gastos

# Aplicar schema desde cero
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/schema.sql

# Cargar datos de prueba
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/data.sql

# Recrear la DB completa
docker exec -it kb-gastos-db psql -U postgres -c "DROP DATABASE IF EXISTS kb_gastos; CREATE DATABASE kb_gastos;"
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/schema.sql
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/data.sql
```

---

## PostgreSQL (queries útiles)

```sql
-- Listar tablas
\dt

-- Ver estructura de una tabla
\d users

-- Ver todos los usuarios
SELECT id, email, name, household_id FROM users;

-- Ver configuración dinámica
SELECT * FROM app_config ORDER BY key;

-- Actualizar URL base (si quedó en localhost)
UPDATE app_config SET value = 'https://kb-gastos.jafpsoft.com' WHERE key = 'app.base_url';

-- Ver logs de emails
SELECT to_email, type, status, error_message, created_at
FROM email_logs
ORDER BY created_at DESC
LIMIT 20;

-- Ver sesiones activas de Telegram
SELECT * FROM telegram_sessions WHERE state != 'IDLE';
```

---

## Seguridad

```bash
# Generar JWT secret seguro (256 bits)
openssl rand -hex 64

# Generar password fuerte
openssl rand -base64 32

# Verificar que no hay secretos en el repo
# (requiere gitleaks instalado)
gitleaks detect --source . --verbose
```

---

## Git

```bash
# Estado del repo
git status

# Historial reciente
git log --oneline -10

# Agregar archivos específicos y commitear
git add ruta/al/archivo.java
git commit -m "feat: descripción del cambio"
git push

# Ver cambios del último commit
git show --stat HEAD
```

---

## Verificación del sistema

```bash
# Health check local
curl http://localhost:8080/api/health

# Health check producción
curl https://kb-gastos-backend.onrender.com/api/health

# Login de prueba
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@example.com","password":"password123"}'

# Swagger UI
open http://localhost:8080/swagger-ui.html
```
