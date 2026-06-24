import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import MercadoPagoButton from '../components/MercadoPagoButton'
import MpCheckoutModal from '../components/MpCheckoutModal'
import PhoneInput from '../components/PhoneInput'
import { COUNTRIES } from '../utils/countries'
import { ticketsApi } from '../api/tickets'
import { adminApi } from '../api/admin'
import { fmtDate, fmtDateLong } from '../utils/date'
import NCNDModal from '../components/NCNDModal'

const STATUS_LABELS = { PAID: 'Pagado', DRAFT: 'Borrador', CANCELLED: 'Cancelado' }
const STATUS_COLORS = { PAID: '#16a34a', DRAFT: '#ca8a04', CANCELLED: '#dc2626' }

function buildWhatsAppText(ticket, config) {
  const cur = config?.currency || '$'
  const biz = config?.businessName || 'Tienda'
  let text = `*Comprobante de compra — ${biz}*\n`
  if (ticket.ticketNumber) text += `N°: ${ticket.ticketNumber}\n`
  text += `Fecha: ${fmtDate(ticket.createdAt)}\n\n`
  text += `*Detalle:*\n`
  ticket.items?.forEach(it => {
    const sub = (Number(it.unitPrice) * it.quantity).toLocaleString('es-AR')
    text += `• ${it.productName}${it.size ? ` (${it.size})` : ''} × ${it.quantity} — ${cur}${sub}\n`
  })
  text += `\n*Subtotal:* ${cur}${Number(ticket.subtotal).toLocaleString('es-AR')}\n`
  if (ticket.discount > 0) text += `*Descuento:* ${cur}${Number(ticket.discount).toLocaleString('es-AR')}\n`
  text += `*Total: ${cur}${Number(ticket.total).toLocaleString('es-AR')}*\n`
  if (ticket.paymentMethod) text += `\nForma de pago: ${ticket.paymentMethod}\n`
  if (config?.footer) text += `\n${config.footer}`
  return encodeURIComponent(text)
}

function buildTicketHtml(ticket, config) {
  const cur = config?.currency || '$'
  const biz = config?.businessName || 'Mi tienda'
  const rows = (ticket.items || []).map(it =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">${it.productName}${it.size ? ` (${it.size})` : ''}</td>
     <td style="padding:6px 0;text-align:center;border-bottom:1px solid #f3f4f6;">${it.quantity}</td>
     <td style="padding:6px 0;text-align:right;border-bottom:1px solid #f3f4f6;">${cur}${Number(it.unitPrice).toLocaleString('es-AR')}</td>
     <td style="padding:6px 0;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:600;">${cur}${Number(it.subtotal).toLocaleString('es-AR')}</td></tr>`
  ).join('')
  return `<strong>${biz}</strong> — ${ticket.ticketNumber}<br>${fmtDateLong(ticket.createdAt)}<br><br>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead><tr style="font-size:12px;color:#9ca3af">
        <th align="left">Producto</th><th>Cant.</th><th align="right">Precio</th><th align="right">Subtotal</th>
      </tr></thead><tbody>${rows}</tbody>
    </table><br>
    <strong>Total: ${cur}${Number(ticket.total).toLocaleString('es-AR')}</strong>
    ${ticket.paymentMethod ? `<br>Forma de pago: ${ticket.paymentMethod}` : ''}
    ${config?.footer ? `<br><br><em>${config.footer}</em>` : ''}`
}

// Comprobante imprimible con formato AFIP cuando puntoVenta está configurado
function InvoiceDocument({ ticket, config }) {
  const [catalogQrUrl, setCatalogQrUrl] = useState(null)

  useEffect(() => {
    if (!config?.showCatalogQr || !config?.catalogSlug) return
    const url = `${window.location.origin}/p/${config.catalogSlug}`
    import('qrcode').then(QRCode =>
      QRCode.toDataURL(url, { width: 120, margin: 1, color: { dark: '#1e3a5f', light: '#ffffff' } })
        .then(setCatalogQrUrl).catch(() => {})
    ).catch(() => {})
  }, [config?.showCatalogQr, config?.catalogSlug])

  const cur = config?.currency || '$'
  const isAfip = !!config?.puntoVenta
  const tipo = config?.tipoComprobante || 'B'

  const tipoDoc = ticket.tipoDoc || 'COMP'
  const esTc = tipo === 'TC'
  const esNC = tipoDoc === 'NC'
  const esND = tipoDoc === 'ND'
  const tipoLabel = esTc ? 'TICKET COMPROBANTE'
    : esNC ? `NOTA DE CRÉDITO ${tipo !== 'TC' ? tipo : ''}`.trim()
    : esND ? `NOTA DE DÉBITO ${tipo !== 'TC' ? tipo : ''}`.trim()
    : ({ A: 'FACTURA A', B: 'FACTURA B', C: 'FACTURA C' }[tipo] || 'COMPROBANTE')

  return (
    <div className="ticket-paper bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:shadow-none print:rounded-none print:border-0">

      {/* ── Cabecera ── */}
      <div className="relative p-6 pb-4 border-b-2 border-gray-800">
        {/* Logo + nombre (izq) */}
        <div className="flex items-center gap-4">
          {config?.logoUrl && (
            <img src={config.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-lg border border-gray-200" />
          )}
          <div>
            <p className="font-bold text-lg text-gray-900">{config?.businessName || 'Mi tienda'}</p>
            {config?.businessAddress && <p className="text-xs text-gray-500">{config.businessAddress}</p>}
          </div>
        </div>

        {/* Tipo de comprobante (centro absoluto) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-center">
          <h1 className="text-2xl font-black tracking-widest text-gray-900 border-2 border-gray-800 px-5 py-1">
            {isAfip ? tipoLabel : 'COMPROBANTE'}
          </h1>
          <div className="mt-1 border border-gray-400 px-4 py-0.5">
            <span className="font-mono text-sm font-bold text-gray-700">{ticket.ticketNumber}</span>
          </div>
        </div>

        {/* Letra en caja (der) — solo AFIP con tipo A/B/C */}
        {isAfip && !esTc && !esNC && !esND && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 border-2 border-gray-800 flex items-center justify-center">
            <span className="text-3xl font-black text-gray-900">{tipo}</span>
          </div>
        )}
      </div>

      {/* ── Emisor / Fecha / Cliente ── */}
      <div className="grid grid-cols-3 border-b border-gray-300">
        {/* Emisor */}
        <div className="p-4 border-r border-gray-300">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-2">Emisor</p>
          <p className="text-sm font-semibold text-gray-900">{config?.businessName || '—'}</p>
          {config?.businessAddress && <p className="text-xs text-gray-600 mt-0.5">{config.businessAddress}</p>}
          {config?.taxId && <p className="text-xs text-gray-600 mt-0.5">CUIT: {config.taxId}</p>}
          {config?.condicionIva && <p className="text-xs text-gray-600 mt-0.5">IVA: {config.condicionIva}</p>}
          {config?.ingresosBrutos && <p className="text-xs text-gray-600">Ing. Brutos: {config.ingresosBrutos}</p>}
          {config?.inicioActividades && <p className="text-xs text-gray-600">Inicio act.: {config.inicioActividades}</p>}
          {config?.businessPhone && <p className="text-xs text-gray-500 mt-1">{config.businessPhone}</p>}
          {config?.businessEmail && <p className="text-xs text-gray-500">{config.businessEmail}</p>}
        </div>

        {/* Fecha */}
        <div className="p-4 border-r border-gray-300 flex flex-col items-center justify-center text-center gap-2">
          <div className="border border-gray-300 rounded px-3 py-1.5 w-full">
            <p className="text-xs text-gray-500">Emitida</p>
            <p className="text-sm font-semibold text-gray-900">{fmtDate(ticket.createdAt)}</p>
          </div>
          {ticket.referenceTicketNumber && (
            <div className="border border-orange-300 rounded px-3 py-1.5 w-full bg-orange-50">
              <p className="text-xs text-orange-500">Referencia</p>
              <p className="text-sm font-semibold text-orange-700 font-mono">{ticket.referenceTicketNumber}</p>
            </div>
          )}
          {ticket.paymentMethod && (
            <div className="border border-gray-300 rounded px-3 py-1.5 w-full">
              <p className="text-xs text-gray-500">Forma de pago</p>
              <p className="text-sm font-semibold text-gray-900">{ticket.paymentMethod}</p>
            </div>
          )}
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium`}
            style={{ background: STATUS_COLORS[ticket.status] + '22', color: STATUS_COLORS[ticket.status] }}>
            {STATUS_LABELS[ticket.status] || ticket.status}
          </span>
          {ticket.cancellationReason && (
            <p className="text-xs text-red-400 mt-1 italic">Motivo: {ticket.cancellationReason}</p>
          )}
        </div>

        {/* Cliente */}
        <div className="p-4">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-2">Cliente</p>
          {ticket.customerName
            ? <p className="text-sm font-semibold text-gray-900">{ticket.customerName}</p>
            : <p className="text-xs text-gray-400 italic">Consumidor Final</p>
          }
          {ticket.customerDni && <p className="text-xs text-gray-600 font-mono mt-0.5">DNI/CUIT: {ticket.customerDni}</p>}
          {ticket.customerPhone && <p className="text-xs text-gray-600 mt-0.5">{ticket.customerPhone}</p>}
          {ticket.customerEmail && <p className="text-xs text-gray-600">{ticket.customerEmail}</p>}
          {ticket.customerNotes && <p className="text-xs text-gray-500 mt-1 italic">{ticket.customerNotes}</p>}
        </div>
      </div>

      {/* ── Items ── */}
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
            {ticket.items?.map(it => (
              <tr key={it.id}>
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

        {/* Totales */}
        <div className="border-t border-gray-200 pt-3 ml-auto max-w-xs space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>{cur}{Number(ticket.subtotal).toLocaleString('es-AR')}</span>
          </div>
          {Number(ticket.discount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento</span><span>-{cur}{Number(ticket.discount).toLocaleString('es-AR')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-300 pt-2">
            <span>TOTAL</span><span>{cur}{Number(ticket.total).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* Notas */}
        {ticket.notes && (
          <p className="text-xs text-gray-400 italic mt-4 pt-3 border-t border-gray-100">{ticket.notes}</p>
        )}
      </div>

      {/* ── Pie ── */}
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
        {ticket?.publicToken && (
          <div className="no-print flex items-center justify-center gap-1.5 pt-2 border-t border-gray-100">
            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <a href={`/ver/${ticket.publicToken}`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-500 hover:underline truncate">
              Ver comprobante online
            </a>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center pt-1 border-t border-gray-100">
          Este documento no es válido como factura oficial
        </p>
      </div>
    </div>
  )
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [customerForm, setCustomerForm] = useState({ customerName: '', customerDni: '', customerPhone: '', customerPhoneCountry: 'AR', customerEmail: '', customerNotes: '' })
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [showNcNd, setShowNcNd] = useState(null) // 'NC' | 'ND' | null
  const [showMpModal, setShowMpModal] = useState(false)

  function handleMpTicketUpdate(newStatus, partialData) {
    setTicket(prev => prev ? { ...prev, status: newStatus, ...partialData } : prev)
    if (newStatus === 'PAID') ticketsApi.get(id).then(r => setTicket(r.data)).catch(() => {})
  }

  useEffect(() => {
    Promise.all([ticketsApi.get(id), ticketsApi.getConfig()])
      .then(([tr, cr]) => {
        setTicket(tr.data)
        setConfig(cr.data)
        setCustomerForm({
          customerName: tr.data.customerName || '',
          customerDni: tr.data.customerDni || '',
          customerPhone: tr.data.customerPhone || '',
          customerPhoneCountry: tr.data.customerPhoneCountry || 'AR',
          customerEmail: tr.data.customerEmail || '',
          customerNotes: tr.data.customerNotes || '',
        })
      })
      .catch(() => { toast.error('Error al cargar ticket'); navigate('/tickets') })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSaveCustomer(e) {
    e.preventDefault()
    setSavingCustomer(true)
    try {
      const { data } = await ticketsApi.updateCustomer(id, customerForm)
      setTicket(data)
      setCustomerForm({
        customerName: data.customerName || '',
        customerDni: data.customerDni || '',
        customerPhone: data.customerPhone || '',
        customerPhoneCountry: data.customerPhoneCountry || 'AR',
        customerEmail: data.customerEmail || '',
        customerNotes: data.customerNotes || '',
      })
      setEditingCustomer(false)
      toast.success('Datos del comprador actualizados')
    } catch { toast.error('Error al guardar') }
    finally { setSavingCustomer(false) }
  }

  async function handleSendEmail() {
    if (!ticket.customerEmail) { toast.error('El cliente no tiene email registrado'); return }
    setSendingEmail(true)
    try {
      await ticketsApi.sendEmail(id)
      toast.success(`Email enviado a ${ticket.customerEmail}`)
    } catch { toast.error('Error al enviar email') }
    finally { setSendingEmail(false) }
  }

  function handleWhatsApp() {
    const entry = COUNTRIES.find(c => c.code === (ticket.customerPhoneCountry || 'AR'))
    const dialDigits = entry?.dial?.replace(/\D/g, '') || ''
    const phoneDigits = ticket.customerPhone?.replace(/\D/g, '') || ''
    if (!phoneDigits) { toast.error('El cliente no tiene teléfono registrado'); return }
    const fullNum = dialDigits ? dialDigits + phoneDigits : phoneDigits
    let text = buildWhatsAppText(ticket, config)
    if (ticket.publicToken) {
      const link = `${window.location.origin}/ver/${ticket.publicToken}`
      text += encodeURIComponent(`\n\nVer comprobante online: ${link}`)
    }
    window.open(`https://wa.me/${fullNum}?text=${text}`, '_blank')
  }

  function handleShareLink() {
    const link = `${window.location.origin}/ver/${ticket.publicToken}`
    const msg = encodeURIComponent(`Hola! Te comparto tu comprobante: ${link}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) return <Layout><div className="text-center py-16 text-gray-400">Cargando...</div></Layout>
  if (!ticket) return null

  const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .ticket-paper { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          a[href]::after { content: none !important; }
        }
      `}</style>

      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Modal pago MP */}
          {showMpModal && (
            <MpCheckoutModal
              ticket={ticket}
              onClose={(paidTicket) => {
                setShowMpModal(false)
                if (paidTicket) handleMpTicketUpdate(paidTicket.status, paidTicket)
              }}
            />
          )}

          {/* Modal NC / ND */}
          {showNcNd && (
            <NCNDModal
              tipo={showNcNd}
              refTicket={ticket}
              config={config}
              onClose={() => setShowNcNd(null)}
              onCreated={(data) => {
                setShowNcNd(null)
                navigate(`/tickets/${data.id}`)
              }}
            />
          )}

          {/* Modal editar comprador */}
          {editingCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Datos del comprador</h3>
                  <button onClick={() => setEditingCustomer(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleSaveCustomer} className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Nombre" value={customerForm.customerName}
                      onChange={e => setCustomerForm(f => ({ ...f, customerName: e.target.value }))} className={inputCls} />
                    <input type="text" placeholder="DNI / CUIT" value={customerForm.customerDni}
                      onChange={e => setCustomerForm(f => ({ ...f, customerDni: e.target.value }))} className={inputCls} />
                  </div>
                  <PhoneInput
                    phone={customerForm.customerPhone}
                    onPhoneChange={v => setCustomerForm(f => ({ ...f, customerPhone: v }))}
                    country={customerForm.customerPhoneCountry}
                    onCountryChange={v => setCustomerForm(f => ({ ...f, customerPhoneCountry: v }))}
                    placeholder="Teléfono WhatsApp"
                  />
                  <input type="email" placeholder="Email" value={customerForm.customerEmail}
                    onChange={e => setCustomerForm(f => ({ ...f, customerEmail: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Notas" value={customerForm.customerNotes}
                    onChange={e => setCustomerForm(f => ({ ...f, customerNotes: e.target.value }))} className={inputCls} />
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setEditingCustomer(false)}
                      className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={savingCustomer}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                      {savingCustomer ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-start justify-between mb-6 no-print">
            <div>
              <button onClick={() => navigate('/tickets')}
                className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tickets
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{ticket.ticketNumber}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">{fmtDateLong(ticket.createdAt)}</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {ticket.customerPhone && (
                <button onClick={handleWhatsApp} title="Compartir por WhatsApp"
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </button>
              )}
              {ticket.customerEmail && (
                <button onClick={handleSendEmail} disabled={sendingEmail}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {sendingEmail ? 'Enviando...' : 'Email'}
                </button>
              )}
              {ticket.tipoDoc !== 'NC' && ticket.tipoDoc !== 'ND' && ticket.status !== 'CANCELLED' && (
                <>
                  <button onClick={() => setShowNcNd('NC')}
                    className="flex items-center gap-1.5 px-3 py-2 border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-medium rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Nota de crédito
                  </button>
                  <button onClick={() => setShowNcNd('ND')}
                    className="flex items-center gap-1.5 px-3 py-2 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-medium rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Nota de débito
                  </button>
                </>
              )}
              <button onClick={() => setEditingCustomer(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Comprador
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Pago con Mercado Pago — visible para tickets DRAFT/PAYMENT_PENDING/PAYMENT_FAILED */}
          {config?.mpEnabled && ['DRAFT', 'PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(ticket.status) && (
            <div className="mb-4 no-print">
              <MercadoPagoButton
                ticket={ticket}
                mpEnabled={config.mpEnabled}
                onTicketUpdate={handleMpTicketUpdate}
                onOpenCheckout={() => setShowMpModal(true)}
              />
            </div>
          )}

          <InvoiceDocument ticket={ticket} config={config} />
        </div>
      </Layout>
    </>
  )
}
