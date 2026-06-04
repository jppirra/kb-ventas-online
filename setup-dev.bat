@echo off
REM ============================================================
REM KB Gastos — Script de configuración del entorno (Windows)
REM Ejecutar desde la raíz del proyecto: .\setup-dev.bat
REM ============================================================

echo.
echo ============================================================
echo  KB Gastos - Configuracion del entorno de desarrollo
echo ============================================================
echo.

REM --- Verificar prerrequisitos ---
echo [1/5] Verificando prerrequisitos...

where java >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java no encontrado. Instalar Java 21+
    echo        https://adoptium.net/
    exit /b 1
)

where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Maven no encontrado. Instalar Maven 3.8+
    echo        https://maven.apache.org/download.cgi
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no encontrado. Instalar Node.js 18+
    echo        https://nodejs.org/
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no encontrado. Instalar Docker Desktop
    echo        https://www.docker.com/products/docker-desktop/
    exit /b 1
)

echo OK - Java, Maven, Node.js y Docker encontrados.
echo.

REM --- Variables de entorno ---
echo [2/5] Configurando variables de entorno...

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo ADVERTENCIA: Se creo .env desde .env.example
    echo              Completar las variables requeridas antes de continuar:
    echo              - DB_PASSWORD
    echo              - JWT_SECRET (usar: openssl rand -hex 64)
    echo.
    echo Abriendo .env para edicion...
    notepad .env
)

if not exist "frontend\.env.local" (
    copy "frontend\.env.example" "frontend\.env.local" >nul
    echo OK - frontend\.env.local creado.
)

echo.

REM --- Base de datos ---
echo [3/5] Levantando base de datos PostgreSQL...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: No se pudo levantar Docker. Verificar que Docker Desktop este corriendo.
    exit /b 1
)

echo Esperando que PostgreSQL este listo...
timeout /t 5 /nobreak >nul

echo Aplicando schema...
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database\schema.sql 2>nul
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Error al aplicar schema. Puede que ya exista o que la DB no este lista.
    echo             Intentar manualmente: docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database\schema.sql
)

echo Cargando datos de prueba...
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database\data.sql 2>nul
echo.

REM --- Backend ---
echo [4/5] Instalando dependencias del backend...
cd backend
call mvn dependency:resolve -q
if %errorlevel% neq 0 (
    echo ERROR: Fallo al resolver dependencias Maven.
    exit /b 1
)
cd ..
echo OK - Dependencias del backend listas.
echo.

REM --- Frontend ---
echo [5/5] Instalando dependencias del frontend...
cd frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Fallo npm install.
    exit /b 1
)
cd ..
echo OK - Dependencias del frontend listas.
echo.

REM --- Resumen ---
echo ============================================================
echo  Configuracion completada
echo ============================================================
echo.
echo  Para iniciar el proyecto, abrir DOS terminales:
echo.
echo  Terminal 1 (Backend):
echo    cd backend
echo    mvn spring-boot:run
echo    -> API: http://localhost:8080
echo    -> Swagger: http://localhost:8080/swagger-ui.html
echo.
echo  Terminal 2 (Frontend):
echo    cd frontend
echo    npm run dev
echo    -> App: http://localhost:5173
echo.
echo  Usuarios de prueba:
echo    juan@example.com  / password123
echo    maria@example.com / password123
echo.
echo  Health check: http://localhost:8080/api/health
echo ============================================================
echo.
