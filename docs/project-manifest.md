# Project Manifest — KB Gastos

## Propósito

KB Gastos es una plataforma SaaS de gestión de gastos personales y empresariales desarrollada y mantenida por **JAFPSoft.com**. Permite a grupos familiares y equipos empresariales registrar, categorizar y analizar gastos desde la web, WhatsApp o Telegram.

---

## Módulos implementados

### 1. Hogares (personal/familiar)

Grupos de usuarios con gastos compartidos.

- Creación de hogar y sistema de invitaciones (por email o código)
- Roles: ADMIN / MEMBER
- Categorías de gastos personalizables (con iconos y colores)
- 18 categorías por defecto al crear el hogar
- Presupuestos mensuales por categoría con alertas
- Dashboard con gráficos de distribución y proyección
- Reportes CSV exportables

### 2. Transacciones

- Gastos e ingresos con fecha, moneda, categoría y descripción
- Multi-moneda: ARS, USD, EUR, BRL, GBP (+ más)
- Filtros por mes, categoría y usuario
- Color por usuario para identificar quién cargó cada registro
- Fuentes de registro: WEB, TELEGRAM, WHATSAPP

### 3. Viáticos empresariales

Sistema completo de rendición de viáticos para empresas.

- Múltiples empresas por usuario
- Roles: OWNER (propietario) / APPROVER (aprobador) / COLLABORATOR (empleado)
- Invitaciones por email o código con expiración de 7 días
- Rendiciones (trips) con gastos y comprobantes adjuntos (Supabase Storage)
- Workflow de aprobación: OPEN → SUBMITTED → APPROVED / REJECTED / REVISION_REQUESTED
- Notificaciones por email al colaborador en cada cambio de estado
- Notificaciones por email a aprobadores cuando se envía una rendición
- PDF exportable de cada rendición
- Dashboard por empresa con métricas y resumen de miembros
- Categorías de gastos específicas por empresa

### 4. Bots de mensajería

**WhatsApp:**
- Registro de gastos por mensaje de texto
- Categorización automática por fuzzy matching
- Respuesta automática a números no registrados

**Telegram:**
- Registro de gastos con clasificación Personal / Viático
- Consulta de saldo del mes
- Creación y unión a hogares desde el bot
- Gestión de sesión por estado (state machine en DB)
- Adjunto de comprobantes (foto)

### 5. Autenticación y usuarios

- Registro con verificación de email (token 24h)
- Login con email/contraseña
- Login con Google (OAuth 2.0)
- Recuperación de contraseña por email
- Reactivación de cuenta desactivada
- Refresh token (sesiones de 7 días)
- Onboarding wizard en el primer login (T&C → tipo de uso → empresa → hogar)

### 6. Notificaciones

- Centro de notificaciones in-app
- Bell con badge de no leídas
- Soporte para guía de configuración de Telegram

### 7. Panel de administración

- Gestión de usuarios y hogares
- Estadísticas del sistema
- Email logs con reenvío de prueba
- Configuración dinámica de la app (subjects de email, colores, URLs)
- Acceso restringido a usuarios con `app_admin = true`

---

## Despliegue actual

| Componente | Servicio | URL |
|---|---|---|
| Frontend | Vercel (Hobby) | https://kb-gastos.jafpsoft.com |
| Backend | Render (Free) | https://kb-gastos-backend.onrender.com |
| Dominio | Porkbun | jafpsoft.com |
| Email | Resend | noreply@jafpsoft.com |
| Storage | Supabase | bucket viaticos-receipts |

---

## Versiones

| Componente | Versión |
|---|---|
| Backend | 1.1.0 (pom.xml) |
| Frontend | 0.1.0 (package.json) |

---

## Términos y condiciones

Los T&C están implementados en `frontend/src/components/TermsModal.jsx`. El campo `terms_accepted` en la tabla `users` registra la aceptación. Los usuarios nuevos deben aceptarlos en el onboarding.

Jurisdicción: República Argentina. Tribunales de la Ciudad Autónoma de Buenos Aires.
