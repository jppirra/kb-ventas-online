import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import { fmtDate, fmtDateLong } from '../utils/date'

const STATUS_LABELS = { PAID: 'Pagado', DRAFT: 'Borrador', CANCELLED: 'Cancelado' }
const STATUS_COLORS = { PAID: '#16a34a', DRAFT: '#ca8a04', CANCELLED: '#dc2626' }

export default function PublicTicketPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [catalogQrUrl, setCatalogQrUrl] = useState(null)

  useEffect(() => {
    api.get(`/public/tickets/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError('Comprobante no encontrado o link inválido.'))
  }, [token])

  useEffect(() => {
    if (!data?.config?.showCatalogQr || !data?.config?.catalogSlug) return
    const url = `${window.location.origin}/p/${data.config.catalogSlug}`
    import('qrcode').then(QRCode =>
      QRCode.toDataURL(url, { width: 120, margin: 1, color: { dark: '#1e3a5f', light: '#ffffff' } })
        .then(setCatalogQrUrl).catch(() => {})
    ).catch(() => {})
  }, [data?.config?.showCatalogQr, data?.config?.catalogSlug])

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { ticket, config } = data
  const cur = config?.currency || '$'
  const isAfip = !!config?.puntoVenta
  const tipo = config?.tipoComprobante || 'B'
  const tipoDoc = ticket?.tipoDoc || 'COMP'
  const esTc = tipo === 'TC'
  const esNC = tipoDoc === 'NC'
  const esND = tipoDoc === 'ND'
  const tipoLabel = esTc ? 'TICKET COMPROBANTE'
    : esNC ? `NOTA DE CRÉDITO ${tipo !== 'TC' ? tipo : ''}`.trim()
    : esND ? `NOTA DE DÉBITO ${tipo !== 'TC' ? tipo : ''}`.trim()
    : ({ A: 'FACTURA A', B: 'FACTURA B', C: 'FACTURA C' }[tipo] || 'COMPROBANTE')

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header Mercato */}
        <div className="text-center mb-4">
          <a href="/" className="inline-flex items-center gap-2 text-indigo-600 text-xs hover:underline">
            <img src="/logo-icon.png" alt="" className="h-5 w-5 rounded object-cover" />
            Powered by Mercato
          </a>
        </div>

        {/* Comprobante */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Cabecera */}
          <div className="relative p-6 pb-4 border-b-2 border-gray-800">
            <div className="flex items-center gap-4">
              {config?.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-lg border border-gray-200" />
              )}
              <div>
                <p className="font-bold text-lg text-gray-900">{config?.businessName || 'Comprobante'}</p>
                {config?.businessAddress && <p className="text-xs text-gray-500">{config.businessAddress}</p>}
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-center">
              <h1 className="text-2xl font-black tracking-widest text-gray-900 border-2 border-gray-800 px-5 py-1">
                {isAfip ? tipoLabel : 'COMPROBANTE'}
              </h1>
              <div className="mt-1 border border-gray-400 px-4 py-0.5">
                <span className="font-mono text-sm font-bold text-gray-700">{ticket?.ticketNumber}</span>
              </div>
            </div>
            {isAfip && !esTc && !esNC && !esND && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 border-2 border-gray-800 flex items-center justify-center">
                <span className="text-3xl font-black text-gray-900">{tipo}</span>
              </div>
            )}
          </div>

          {/* Emisor / Fecha / Cliente */}
          <div className="grid grid-cols-3 border-b border-gray-300">
            <div className="p-4 border-r border-gray-300">
              <p className="text-xs font-bold text-blue-700 uppercase mb-2">Emisor</p>
              <p className="text-sm font-semibold text-gray-900">{config?.businessName || '—'}</p>
              {config?.businessAddress && <p className="text-xs text-gray-600 mt-0.5">{config.businessAddress}</p>}
              {config?.taxId && <p className="text-xs text-gray-600 mt-0.5">CUIT: {config.taxId}</p>}
              {config?.condicionIva && <p className="text-xs text-gray-600 mt-0.5">IVA: {config.condicionIva}</p>}
              {config?.ingresosBrutos && <p className="text-xs text-gray-600">Ing. Brutos: {config.ingresosBrutos}</p>}
              {config?.inicioActividades && <p className="text-xs text-gray-600">Inicio act.: {config.inicioActividades}</p>}
              {config?.businessPhone && <p className="text-xs text-gray-500 mt-1">{config.businessPhone}</p>}
              {config?.businessEmail && <p className="text-xs text-gray-500">{config.businessEmail}</p>}
            </div>
            <div className="p-4 border-r border-gray-300 flex flex-col items-center justify-center text-center gap-2">
              <div className="border border-gray-300 rounded px-3 py-1.5 w-full">
                <p className="text-xs text-gray-500">Emitida</p>
                <p className="text-sm font-semibold text-gray-900">{fmtDate(ticket?.createdAt)}</p>
              </div>
              {ticket?.referenceTicketNumber && (
                <div className="border border-orange-300 rounded px-3 py-1.5 w-full bg-orange-50">
                  <p className="text-xs text-orange-500">Referencia</p>
                  <p className="text-sm font-semibold text-orange-700 font-mono">{ticket.referenceTicketNumber}</p>
                </div>
              )}
              {ticket?.paymentMethod && (
                <div className="border border-gray-300 rounded px-3 py-1.5 w-full">
                  <p className="text-xs text-gray-500">Forma de pago</p>
                  <p className="text-sm font-semibold text-gray-900">{ticket.paymentMethod}</p>
                </div>
              )}
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: (STATUS_COLORS[ticket?.status] || '#6b7280') + '22', color: STATUS_COLORS[ticket?.status] || '#6b7280' }}>
                {STATUS_LABELS[ticket?.status] || ticket?.status}
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-blue-700 uppercase mb-2">Cliente</p>
              {ticket?.customerName
                ? <p className="text-sm font-semibold text-gray-900">{ticket.customerName}</p>
                : <p className="text-xs text-gray-400 italic">Consumidor Final</p>
              }
              {ticket?.customerDni && <p className="text-xs text-gray-600 font-mono mt-0.5">DNI/CUIT: {ticket.customerDni}</p>}
              {ticket?.customerPhone && <p className="text-xs text-gray-600 mt-0.5">{ticket.customerPhone}</p>}
              {ticket?.customerEmail && <p className="text-xs text-gray-600">{ticket.customerEmail}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="p-5">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-200 bg-gray-50">
                  <th className="pb-2 pt-1 px-2 font-medium">Producto</th>
                  <th className="pb-2 pt-1 font-medium text-center w-16">Cant.</th>
                  <th className="pb-2 pt-1 font-medium text-right w-28">Precio unit.</th>
                  <th className="pb-2 pt-1 font-medium text-right w-28 pr-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ticket?.items?.map((it, i) => (
                  <tr key={i}>
                    <td className="py-2 px-2">
                      <p className="font-medium text-gray-900">{it.productName}</p>
                      {it.size && <p className="text-xs text-gray-400">Talle: {it.size}</p>}
                      {it.color && <p className="text-xs text-gray-400">Color: {it.color}</p>}
                      {it.productSku && <p className="text-xs text-gray-400 font-mono">SKU: {it.productSku}</p>}
                    </td>
                    <td className="py-2 text-center text-gray-600">{it.quantity}</td>
                    <td className="py-2 text-right text-gray-600">{cur}{Number(it.unitPrice).toLocaleString('es-AR')}</td>
                    <td className="py-2 text-right font-semibold text-gray-900 pr-2">{cur}{Number(it.subtotal).toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 pt-3 ml-auto max-w-xs space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{cur}{Number(ticket?.subtotal).toLocaleString('es-AR')}</span>
              </div>
              {Number(ticket?.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span><span>-{cur}{Number(ticket.discount).toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-300 pt-2">
                <span>TOTAL</span><span>{cur}{Number(ticket?.total).toLocaleString('es-AR')}</span>
              </div>
            </div>

            {ticket?.notes && (
              <p className="text-xs text-gray-400 italic mt-4 pt-3 border-t border-gray-100">{ticket.notes}</p>
            )}
          </div>

          {/* Pie */}
          <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 space-y-2">
            {isAfip && !esTc && (
              <div className="flex gap-6 text-xs text-gray-400">
                <span>CAE: <span className="text-gray-500 italic">— pendiente —</span></span>
                <span>Vto. CAE: <span className="text-gray-500 italic">— —</span></span>
              </div>
            )}
            {config?.footer && (
              <p className="text-xs text-gray-400 text-center">{config.footer}</p>
            )}
            {catalogQrUrl && (
              <div className="flex flex-col items-center gap-1 pt-2 border-t border-gray-100">
                <img src={catalogQrUrl} alt="QR catálogo" className="w-20 h-20" />
                <p className="text-xs text-gray-400">Visitá nuestros catálogos</p>
              </div>
            )}
            <p className="text-xs text-gray-400 text-center pt-1 border-t border-gray-100">
              Este documento no es válido como factura oficial
            </p>
          </div>
        </div>

        {/* Footer Mercato */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by <a href="https://mercato.jafpsoft.com" className="text-indigo-500 hover:underline">Mercato</a>
          {' · '}Desarrollado por <a href="https://jafpsoft.com" className="text-indigo-500 hover:underline">JAFPSoft</a>
        </p>
      </div>
    </div>
  )
}
