# Manual de Usuario — Cobrar con Mercado Pago

**Versión:** v1.004.01 | **Última actualización:** junio 2026

---

## Índice

1. [Introducción: Beneficios de cobrar con Mercado Pago](#1-introducción)
2. [Preparación: Qué información necesitás](#2-preparación)
3. [Configuración en la app: Vincular tu cuenta](#3-configuración)
4. [Venta Online: Cobros automáticos desde el catálogo](#4-venta-online)
5. [Venta Presencial: Cobrar con QR dinámico](#5-venta-presencial)
6. [Monitoreo: Ver el estado de tus cobros](#6-monitoreo)
7. [Troubleshooting: Solución de problemas comunes](#7-troubleshooting)

---

## 1. Introducción

Vincular tu cuenta de Mercado Pago con la app te da **cobro digital en dos escenarios**:

### Venta Online (desde el catálogo)
Cuando un cliente hace un pedido en tu catálogo y vos lo confirmás, el sistema genera automáticamente un comprobante y te notifica. Además, el cliente puede pagar con Mercado Pago desde el link del comprobante.

### Venta Presencial (QR dinámico)
Ingresás el monto a cobrar, se genera un QR y tu cliente lo escanea con el celular para pagar al instante con cualquier medio de Mercado Pago (saldo, tarjeta, cuotas).

**¿Por qué Mercado Pago?**
- El dinero se acredita **directamente en tu cuenta** de MP (no pasa por nosotros)
- Aceptás pagos con tarjeta, saldo MP, transferencia y cuotas
- La conexión es segura: usamos el estándar OAuth 2.0, nunca guardamos tu contraseña
- Podés desconectar tu cuenta en cualquier momento

---

## 2. Preparación

Para vincular tu cuenta solo necesitás **tu cuenta de Mercado Pago activa**. No necesitás Client ID ni Client Secret.

El proceso de vinculación redirige a la página oficial de Mercado Pago, donde autorizás la conexión con tu usuario y contraseña de MP. La app recibe únicamente un token de acceso para crear links de pago en tu nombre.

> **Importante:** Necesitás tener una cuenta de Mercado Pago verificada y habilitada para cobrar. Si tu cuenta tiene restricciones, contactá al soporte de Mercado Pago.

---

## 3. Configuración

### Paso 1: Ir a Facturación → Configurar

1. Iniciá sesión en la app
2. En el menú lateral, hacé clic en **Facturación**
3. En la esquina superior derecha, hacé clic en **Configurar**

### Paso 2: Conectar tu cuenta de Mercado Pago

En la parte inferior de la página de configuración, vas a ver la sección **"Medios de pago digital"**.

```
┌─────────────────────────────────────────┐
│  💳 Mercado Pago                        │
│  Cobrá con link de pago directo         │
│                                         │
│  Conectá tu cuenta de Mercado Pago      │
│  para generar links de pago en tus      │
│  comprobantes.                          │
│                                         │
│  [Conectar con Mercado Pago]           │
└─────────────────────────────────────────┘
```

Hacé clic en **"Conectar con Mercado Pago"**.

### Paso 3: Autorizar en Mercado Pago

Se abre una ventana de Mercado Pago. Iniciá sesión con tu cuenta y hacé clic en **"Permitir"** para autorizar la conexión.

### Paso 4: Confirmar la conexión

Una vez autorizado, la app muestra el panel de Mercado Pago con el estado **"Conectado"** y la fecha de conexión.

```
┌─────────────────────────────────────────┐
│  💳 Mercado Pago          ✓ Conectado   │
│                                         │
│  ID de cuenta: 123456789                │
│  Conectado el 15 jun. 2026              │
│                                         │
│  Desconectar cuenta                     │
└─────────────────────────────────────────┘
```

> **Listo.** A partir de ahora, cada comprobante muestra un botón para generar el link de pago.

---

## 4. Venta Online

### Cómo funciona el flujo completo

```
Cliente navega el catálogo
         ↓
   Hace un pedido
         ↓
 Vos recibís notificación push + email
         ↓
 Confirmás el pedido desde "Pedidos"
         ↓
 La app genera el comprobante automáticamente
         ↓
 Compartís el link de pago por WhatsApp
         ↓
 Cliente paga → comprobante se confirma solo
```

### Generar el link de pago desde un comprobante

1. Abrí el comprobante (en Facturación → clic en el número)
2. Si el comprobante está en estado **"Borrador"**, verás el botón **"Generar link de pago"**

```
┌─────────────────────────────────────────┐
│  🔗 Generar link de pago               │
└─────────────────────────────────────────┘
```

3. Hacé clic → se abre el checkout de Mercado Pago en una nueva pestaña
4. Podés copiar el link y enviarlo por WhatsApp o email
5. Cuando el cliente paga, el comprobante cambia automáticamente a **"Pagado"**

### Estados del comprobante

| Estado | Descripción |
|--------|-------------|
| **Borrador** | Generado automáticamente, esperando pago |
| **Esperando pago** | Link de pago activo, cliente todavía no pagó |
| **Pagado** | Pago confirmado por Mercado Pago |
| **Rechazado** | El pago falló o fue rechazado |
| **Cancelado** | Comprobante cancelado manualmente |

---

## 5. Venta Presencial

El QR dinámico es ideal para cobrar **en el momento**, sin necesidad de un POS físico.

### Cómo generar un QR

1. Andá a **Facturación** en el menú
2. Hacé clic en el botón **"Cobrar QR"** (aparece solo si tenés MP conectado)

```
┌──────────────────────────────────────────────────────┐
│  [Filtros]  [Configurar]  [Cobrar QR]  [+ Nueva venta] │
└──────────────────────────────────────────────────────┘
```

3. Ingresá el **monto** a cobrar y una descripción opcional

```
┌─────────────────────────────────┐
│  💳 Cobrar con QR               │
│                                 │
│  Monto a cobrar *               │
│  $ [    1500.00               ] │
│                                 │
│  Descripción (opcional)         │
│  [ Remera manga corta          ]│
│                                 │
│  [Cancelar]  [Generar QR]      │
└─────────────────────────────────┘
```

4. Hacé clic en **"Generar QR"**

5. Aparece el QR en pantalla → mostráselo al cliente para que lo escanee

```
┌─────────────────────────────────┐
│  Monto: $1.500,00               │
│  Remera manga corta             │
│                                 │
│  ████████████████████████       │
│  ██  ██  ████  ██  ██  ██       │
│  ████████████████████████       │
│                                 │
│  [Copiar link] [Abrir link]    │
│  Generar otro QR               │
└─────────────────────────────────┘
```

6. El cliente escanea el QR con su celular y paga con Mercado Pago

> **El QR expira automáticamente** si no se usa. Podés generar uno nuevo cuando quieras.

### Consejos para la venta presencial

- **Mostrá el QR en pantalla** — el cliente lo escanea con la cámara de su celular (no necesita instalar nada si ya tiene MP)
- **Copiar link** → envialo por WhatsApp si el cliente prefiere pagar desde su casa
- **Generar otro QR** → para el próximo cliente, hacé clic y repetí el proceso

---

## 6. Monitoreo

### Ver el estado de un cobro

En **Facturación**, la lista de comprobantes muestra el estado de cada uno:

- **Borrador** (amarillo) → pendiente de pago
- **Pagado** (verde) → acreditado
- **Rechazado** (rojo) → falló

Hacé clic en cualquier comprobante para ver el detalle completo, incluyendo el ID del pago en Mercado Pago.

### Desde Mercado Pago

Todos los pagos también aparecen en tu cuenta de Mercado Pago:
- App de Mercado Pago → Inicio → Actividad reciente
- Web: mercadopago.com.ar → Tu negocio → Actividad

Desde ahí podés ver el detalle de cada pago, emitir facturas y hacer devoluciones.

### Notificaciones

Cuando se confirma un pago recibís:
- **Notificación push** en la app (si tenés el panel abierto)
- El comprobante cambia automáticamente a "Pagado"

---

## 7. Troubleshooting

### El botón "Conectar con Mercado Pago" no aparece

Asegurate de estar en **Facturación → Configurar** y scrollear hasta abajo, sección "Medios de pago digital".

### La conexión falló / "Error al conectar"

- Verificá que tu cuenta de Mercado Pago esté activa y verificada
- Intentá de nuevo desde "Conectar con Mercado Pago"
- Si el problema persiste, desconectá y volvé a conectar

### "Mercado Pago no está conectado" al generar un link

Tu token de acceso puede haber vencido. Solución:
1. Andá a Configurar → sección "Medios de pago digital"
2. Hacé clic en **"Desconectar cuenta"**
3. Volvé a conectar con el botón **"Conectar con Mercado Pago"**

### El cliente pagó pero el comprobante sigue "Esperando pago"

Puede haber un retraso de 1-5 minutos en la notificación de MP. El estado se actualiza automáticamente. Si después de 10 minutos sigue sin cambiar:
- Verificá en tu cuenta de Mercado Pago que el pago esté aprobado
- Contactá al soporte de la app si el pago está aprobado en MP pero el comprobante no se actualizó

### El QR no muestra imagen

El QR se genera en el navegador. Si no aparece la imagen:
- Recargá la página y volvé a intentar
- Como alternativa, usá el botón **"Abrir link"** o **"Copiar link"** para compartir el link de pago directamente

### ¿Puedo desconectar mi cuenta en cualquier momento?

Sí. En Configurar → sección Mercado Pago → **"Desconectar cuenta"**. Los links de pago que ya enviaste dejarán de funcionar, pero los comprobantes ya pagados quedan registrados.

### ¿Dónde se acredita el dinero?

Directamente en **tu cuenta de Mercado Pago**. La app no retiene ni procesa el dinero.

---

*¿Tenés más dudas?* Escribinos a través del formulario de contacto en la app o a nuestro soporte.
