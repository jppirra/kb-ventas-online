#!/bin/bash
# ============================================================
# KB Gastos — Script de configuración del entorno (Unix/Mac)
# Ejecutar desde la raíz del proyecto: bash setup-dev.sh
# ============================================================

set -e

echo ""
echo "============================================================"
echo " KB Gastos - Configuracion del entorno de desarrollo"
echo "============================================================"
echo ""

# --- Verificar prerrequisitos ---
echo "[1/5] Verificando prerrequisitos..."

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "ERROR: $1 no encontrado. $2"
        exit 1
    fi
}

check_command java "Instalar Java 21+: https://adoptium.net/"
check_command mvn "Instalar Maven 3.8+: https://maven.apache.org/"
check_command node "Instalar Node.js 18+: https://nodejs.org/"
check_command docker "Instalar Docker Desktop: https://www.docker.com/"

echo "OK - Java, Maven, Node.js y Docker encontrados."
echo ""

# --- Variables de entorno ---
echo "[2/5] Configurando variables de entorno..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "ADVERTENCIA: Se creo .env desde .env.example"
    echo "             Completar las variables requeridas antes de continuar:"
    echo "             - DB_PASSWORD"
    echo "             - JWT_SECRET (generar con: openssl rand -hex 64)"
    echo ""
    echo "Presiona Enter para abrir .env en tu editor..."
    read -r
    ${EDITOR:-nano} .env
fi

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo "OK - frontend/.env.local creado."
fi

echo ""

# --- Base de datos ---
echo "[3/5] Levantando base de datos PostgreSQL..."
docker compose up -d

echo "Esperando que PostgreSQL este listo..."
sleep 5

echo "Aplicando schema..."
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/schema.sql || \
    echo "ADVERTENCIA: Error al aplicar schema. Puede que ya exista."

echo "Cargando datos de prueba..."
docker exec -i kb-gastos-db psql -U postgres -d kb_gastos < database/data.sql || \
    echo "ADVERTENCIA: Error al cargar datos."
echo ""

# --- Backend ---
echo "[4/5] Instalando dependencias del backend..."
cd backend
mvn dependency:resolve -q
cd ..
echo "OK - Dependencias del backend listas."
echo ""

# --- Frontend ---
echo "[5/5] Instalando dependencias del frontend..."
cd frontend
npm install --silent
cd ..
echo "OK - Dependencias del frontend listas."
echo ""

# --- Resumen ---
echo "============================================================"
echo " Configuracion completada"
echo "============================================================"
echo ""
echo " Para iniciar el proyecto, abrir DOS terminales:"
echo ""
echo " Terminal 1 (Backend):"
echo "   cd backend && mvn spring-boot:run"
echo "   -> API: http://localhost:8080"
echo "   -> Swagger: http://localhost:8080/swagger-ui.html"
echo ""
echo " Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo "   -> App: http://localhost:5173"
echo ""
echo " Usuarios de prueba:"
echo "   juan@example.com  / password123"
echo "   maria@example.com / password123"
echo ""
echo " Health check: curl http://localhost:8080/api/health"
echo "============================================================"
echo ""
