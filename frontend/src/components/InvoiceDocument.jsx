import React, { useEffect, useState } from 'react'
import { fmtDate } from '../utils/date'

const STATUS_LABELS = {
  PAID:            'Cobrado',
  DRAFT:           'Borrador',
  CANCELLED:       'Anulado',
  PAYMENT_PENDING: 'Esperando pago',
  PAYMENT_FAILED:  'Pago rechazado',
}
const STATUS_BG = {
  PAID:            '#dcfce7',
  DRAFT:           '#fef9c3',
  CANCELLED:       '#fee2e2',
  PAYMENT_PENDING: '#dbeafe',
  PAYMENT_FAILED:  '#ffedd5',
}
const STATUS_COLOR = {
  PAID:            '#15803d',
  DRAFT:           '#a16207',
  CANCELLED:       '#b91c1c',
  PAYMENT_PENDING: '#1d4ed8',
  PAYMENT_FAILED:  '#c2410c',
}

const B  = '2px solid #374151'   // heavy border
const M  = '1px solid #9ca3af'   // medium border
const L  = '1px solid #e5e7eb'   // light border
const ff = 'Arial, Helvetica, sans-serif'
const fm = 'monospace'

const th = (extra = {}) => ({
  padding: '7px 12px',
  fontWeight: 700,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#374151',
  background: '#f3f4f6',
  borderBottom: B,
  ...extra,
})

export default function InvoiceDocument({ ticket, config }) {
  const [catalogQrUrl, setCatalogQrUrl] = useState(null)

  useEffect(() => {
    if (!config?.showCatalogQr || !config?.catalogSlug) return
    const url = `${window.location.origin}/p/${config.catalogSlug}`
    import('qrcode').then(QRCode =>
      QRCode.toDataURL(url, { width: 100, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } })
        .then(setCatalogQrUrl).catch(() => {})
    ).catch(() => {})
  }, [config?.showCatalogQr, config?.catalogSlug])

  const cur = config?.currency || '$'
  const isAfip = !!config?.puntoVenta
  const tipo = config?.tipoComprobante || 'B'
  const tipoDoc = ticket?.tipoDoc || 'COMP'
  const esTc = tipo === 'TC'
  const esNC = tipoDoc === 'NC'
  const esND = tipoDoc === 'ND'

  const tipoLabel = esTc
    ? 'TICKET COMPROBANTE'
    : esNC ? `NOTA DE CRÉDITO ${tipo !== 'TC' ? tipo : ''}`.trim()
    : esND ? `NOTA DE DÉBITO ${tipo !== 'TC' ? tipo : ''}`.trim()
    : isAfip ? ({ A: 'FACTURA A', B: 'FACTURA B', C: 'FACTURA C' }[tipo] || 'COMPROBANTE')
    : 'COMPROBANTE'

  const fmt = (n) =>
    Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fillerRows = Math.max(0, 4 - (ticket?.items?.length || 0))

  return (
    <div
      className="ticket-paper bg-white"
      style={{ fontFamily: ff, fontSize: '12px', color: '#111827', border: B, position: 'relative', overflow: 'hidden' }}
    >
      {/* Marca de agua */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <span style={{
          transform: 'rotate(-35deg)',
          fontSize: '62px',
          fontWeight: 900,
          color: 'rgba(0,0,0,0.045)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          Sin validez fiscal
        </span>
      </div>

      {/* Contenido sobre la marca de agua */}
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ═══ CABECERA TRIPARTITA ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 1fr', borderBottom: B }}>

        {/* Izq: Emisor */}
        <div style={{ padding: '14px 16px', borderRight: M }}>
          {config?.logoUrl && (
            <img
              src={config.logoUrl}
              alt=""
              style={{ maxHeight: '52px', objectFit: 'contain', marginBottom: '8px', display: 'block' }}
            />
          )}
          <p style={{ fontWeight: 700, fontSize: '13px', color: '#111827', marginBottom: '3px' }}>
            {config?.businessName || 'Mi Empresa'}
          </p>
          {config?.businessAddress && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '1px' }}>{config.businessAddress}</p>
          )}
          {config?.businessPhone && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '1px' }}>{config.businessPhone}</p>
          )}
          {config?.businessEmail && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '1px' }}>{config.businessEmail}</p>
          )}
          {config?.condicionIva && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>I.V.A. {config.condicionIva}</p>
          )}
        </div>

        {/* Centro: Tipo / Nro / Fecha / Estado */}
        <div
          style={{
            padding: '14px 12px',
            borderRight: M,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {isAfip && !esTc && !esNC && !esND && (
            <div
              style={{
                border: '3px solid #111827',
                width: '54px',
                height: '54px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1 }}>{tipo}</span>
            </div>
          )}

          <h1
            style={{
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#111827',
              marginBottom: '10px',
            }}
          >
            {tipoLabel}
          </h1>

          <div style={{ border: M, padding: '4px 10px', marginBottom: '6px', width: '100%' }}>
            <p style={{ fontFamily: fm, fontSize: '13px', fontWeight: 700, color: '#1e3a5f' }}>
              {ticket?.ticketNumber}
            </p>
          </div>

          <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '8px' }}>
            Fecha: {fmtDate(ticket?.createdAt)}
          </p>

          {ticket?.status && (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 700,
                background: STATUS_BG[ticket.status] || '#f3f4f6',
                color: STATUS_COLOR[ticket.status] || '#374151',
              }}
            >
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
          )}

          {ticket?.cancellationReason && (
            <p style={{ fontSize: '10px', color: '#b91c1c', fontStyle: 'italic', marginTop: '4px' }}>
              {ticket.cancellationReason}
            </p>
          )}
        </div>

        {/* Der: Datos fiscales */}
        <div style={{ padding: '14px 16px' }}>
          {config?.taxId && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>
              C.U.I.T.:{' '}
              <strong style={{ fontFamily: fm, color: '#111827' }}>{config.taxId}</strong>
            </p>
          )}
          {config?.ingresosBrutos && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>
              Ing. Brutos: {config.ingresosBrutos}
            </p>
          )}
          {config?.inicioActividades && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>
              Inicio actividades: {config.inicioActividades}
            </p>
          )}
          {config?.puntoVenta && (
            <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '3px' }}>
              Pto. de venta:{' '}
              <span style={{ fontFamily: fm }}>{String(config.puntoVenta).padStart(4, '0')}</span>
            </p>
          )}
          {ticket?.referenceTicketNumber && (
            <div
              style={{
                marginTop: '8px',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              <p style={{ fontSize: '10px', color: '#c2410c' }}>
                Referencia:{' '}
                <strong style={{ fontFamily: fm }}>{ticket.referenceTicketNumber}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ DATOS DEL CLIENTE ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: M }}>
        <div style={{ padding: '8px 16px', borderRight: M }}>
          <span
            style={{
              fontSize: '10px',
              color: '#6b7280',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginRight: '6px',
            }}
          >
            Cliente:
          </span>
          <strong style={{ fontSize: '12px' }}>
            {ticket?.customerName || 'Consumidor Final'}
          </strong>
          {ticket?.customerDni && (
            <span style={{ fontSize: '11px', color: '#4b5563', marginLeft: '12px' }}>
              DNI/CUIT:{' '}
              <span style={{ fontFamily: fm }}>{ticket.customerDni}</span>
            </span>
          )}
          {ticket?.customerPhone && (
            <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '12px' }}>
              {ticket.customerPhone}
            </span>
          )}
        </div>
        <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          {ticket?.customerEmail && (
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{ticket.customerEmail}</span>
          )}
          {ticket?.paymentMethod && (
            <span style={{ fontSize: '11px', color: '#4b5563' }}>
              Forma de pago: <strong>{ticket.paymentMethod}</strong>
            </span>
          )}
          {ticket?.customerNotes && (
            <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
              {ticket.customerNotes}
            </span>
          )}
        </div>
      </div>

      {/* ═══ TABLA DE ÍTEMS ═══ */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: M }}>
        <thead>
          <tr>
            <th style={th({ textAlign: 'left', padding: '7px 12px' })}>Descripción</th>
            <th style={th({ textAlign: 'center', width: '60px', borderLeft: M })}>Cant.</th>
            <th style={th({ textAlign: 'right', width: '120px', borderLeft: M })}>Precio Unit.</th>
            <th style={th({ textAlign: 'right', width: '120px', borderLeft: M })}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {ticket?.items?.map((it, i) => (
            <tr key={i} style={{ borderBottom: L }}>
              <td style={{ padding: '9px 12px' }}>
                <p style={{ fontWeight: 600, color: '#111827' }}>{it.productName}</p>
                {it.size && (
                  <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>Talle: {it.size}</p>
                )}
                {it.color && (
                  <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>Color: {it.color}</p>
                )}
                {it.productSku && (
                  <p style={{ fontSize: '10px', color: '#9ca3af', fontFamily: fm, marginTop: '1px' }}>
                    SKU: {it.productSku}
                  </p>
                )}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'center', fontFamily: fm, borderLeft: L }}>
                {it.quantity}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: fm, color: '#4b5563', borderLeft: L }}>
                {cur}{fmt(it.unitPrice)}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: fm, fontWeight: 700, borderLeft: L }}>
                {cur}{fmt(it.subtotal)}
              </td>
            </tr>
          ))}

          {/* Filas de relleno para mantener altura mínima */}
          {Array.from({ length: fillerRows }).map((_, i) => (
            <tr key={`fill-${i}`} style={{ borderBottom: L }}>
              <td style={{ padding: '9px 12px', height: '36px' }}>&nbsp;</td>
              <td style={{ borderLeft: L }}>&nbsp;</td>
              <td style={{ borderLeft: L }}>&nbsp;</td>
              <td style={{ borderLeft: L }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ═══ NOTAS + TOTALES ═══ */}
      <div style={{ display: 'flex', borderBottom: M }}>

        {/* Notas (izq) */}
        <div style={{ flex: 1, padding: '10px 16px', borderRight: M, display: 'flex', alignItems: 'flex-start' }}>
          {ticket?.notes && (
            <p style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>{ticket.notes}</p>
          )}
        </div>

        {/* Totales (der) */}
        <div style={{ minWidth: '270px', padding: '10px 16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#4b5563',
              marginBottom: '5px',
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontFamily: fm }}>{cur}{fmt(ticket?.subtotal)}</span>
          </div>

          {Number(ticket?.discount) > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#15803d',
                marginBottom: '5px',
              }}
            >
              <span>Descuento</span>
              <span style={{ fontFamily: fm }}>-{cur}{fmt(ticket?.discount)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 900,
              color: '#111827',
              borderTop: B,
              paddingTop: '8px',
              marginTop: '6px',
            }}
          >
            <span style={{ fontSize: '13px', letterSpacing: '0.02em' }}>TOTAL A PAGAR</span>
            <span style={{ fontFamily: fm, fontSize: '17px' }}>{cur}{fmt(ticket?.total)}</span>
          </div>
        </div>
      </div>

      {/* ═══ PIE ═══ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '10px 16px',
          borderBottom: L,
          minHeight: '56px',
        }}
      >
        {/* QR catálogo */}
        {catalogQrUrl && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              flexShrink: 0,
            }}
          >
            <img src={catalogQrUrl} alt="QR catálogos" style={{ width: '60px', height: '60px' }} />
            <p style={{ fontSize: '9px', color: '#9ca3af', textAlign: 'center' }}>Nuestros catálogos</p>
          </div>
        )}

        {/* Datos fiscales / footer */}
        <div style={{ flex: 1, fontSize: '11px', color: '#6b7280' }}>
          {config?.footer && (
            <p style={{ fontStyle: 'italic', marginBottom: '3px' }}>{config.footer}</p>
          )}
          {isAfip && !esTc && (
            <p>
              C.A.E. Nro.:{' '}
              <span style={{ fontFamily: fm }}>— pendiente —</span>
              {'   '}
              Fecha Vto. C.A.E.:{' '}
              <span style={{ fontFamily: fm }}>— —</span>
            </p>
          )}
        </div>

        {/* Link online (solo en pantalla, no en impresión) */}
        {ticket?.publicToken && (
          <div className="no-print" style={{ flexShrink: 0, textAlign: 'right' }}>
            <a
              href={`/ver/${ticket.publicToken}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none' }}
            >
              Ver online →
            </a>
          </div>
        )}
      </div>

      {/* Aviso legal */}
      <div style={{ padding: '5px 16px', textAlign: 'center', background: '#f9fafb' }}>
        <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
          Sin validez fiscal — Este documento no es válido como factura oficial
        </p>
      </div>

      </div>{/* /contenido */}
    </div>
  )
}
