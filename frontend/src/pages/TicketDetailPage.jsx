import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { ticketsApi } from '../api/tickets'
import { adminApi } from '../api/admin'

const STATUS_LABELS = { PAID: 'Pagado', DRAFT: 'Borrador', CANCELLED: 'Cancelado' }

function buildWhatsAppText(ticket, config) {
  const cur = config?.currency || '$'
  const biz = config?.businessName || 'Tienda'
  let text = `*Comprobante de compra — ${biz}*\n`
  if (ticket.ticketNumber) text += `Ticket: ${ticket.ticketNumber}\n`
  text += `Fecha: ${new Date(ticket.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}\n\n`
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

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef()
  const [ticket, setTicket] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    Promise.all([ticketsApi.get(id), ticketsApi.getConfig()])
      .then(([tr, cr]) => { setTicket(tr.data); setConfig(cr.data) })
      .catch(() => { toast.error('Error al cargar ticket'); navigate('/tickets') })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSendEmail() {
    if (!ticket.customerEmail) { toast.error('El cliente no tiene email registrado'); return }
    setSendingEmail(true)
    try {
      await adminApi.sendEmail({ to: ticket.customerEmail, subject: `Comprobante ${ticket.ticketNumber}`, body: buildTicketHtml(ticket, config) })
      toast.success(`Email enviado a ${ticket.customerEmail}`)
    } catch { toast.error('Error al enviar email') }
    finally { setSendingEmail(false) }
  }

  function handlePrint() { window.print() }

  function handleWhatsApp() {
    const phone = ticket.customerPhone?.replace(/\D/g, '')
    const text = buildWhatsAppText(ticket, config)
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  if (loading) return <Layout><div className="text-center py-16 text-gray-400">Cargando...</div></Layout>
  if (!ticket) return null

  const cur = config?.currency || '$'

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .ticket-paper { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 no-print">
            <div>
              <button onClick={() => navigate('/tickets')}
                className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tickets
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ticket.ticketNumber}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {new Date(ticket.createdAt).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {ticket.customerPhone && (
                <button onClick={handleWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
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
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Comprobante imprimible */}
          <div ref={printRef} className="ticket-paper bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Cabecera del negocio */}
            <div className="bg-blue-600 text-white p-6 text-center">
              {config?.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
              )}
              <h2 className="text-lg font-bold">{config?.businessName || 'Mi tienda'}</h2>
              {config?.businessAddress && <p className="text-sm text-blue-100">{config.businessAddress}</p>}
              {config?.businessPhone && <p className="text-sm text-blue-100">{config.businessPhone}</p>}
              {config?.taxId && <p className="text-xs text-blue-200 mt-1">CUIT/RUT: {config.taxId}</p>}
            </div>

            <div className="p-6">
              {/* Info del ticket */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide">Comprobante</p>
                  <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">{ticket.ticketNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 dark:text-slate-500">Fecha</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">
                    {new Date(ticket.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              {(ticket.customerName || ticket.customerPhone) && (
                <div className="mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Cliente</p>
                  {ticket.customerName && <p className="font-medium text-gray-900 dark:text-white">{ticket.customerName}</p>}
                  {ticket.customerPhone && <p className="text-sm text-gray-500 dark:text-slate-400">{ticket.customerPhone}</p>}
                  {ticket.customerEmail && <p className="text-sm text-gray-500 dark:text-slate-400">{ticket.customerEmail}</p>}
                  {ticket.customerNotes && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 italic">{ticket.customerNotes}</p>}
                </div>
              )}

              {/* Items */}
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-left text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium text-center">Cant.</th>
                    <th className="pb-2 font-medium text-right">Precio</th>
                    <th className="pb-2 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {ticket.items?.map(it => (
                    <tr key={it.id}>
                      <td className="py-2 pr-2">
                        <p className="font-medium text-gray-900 dark:text-white">{it.productName}</p>
                        {it.size && <p className="text-xs text-gray-400">Talle: {it.size}</p>}
                        {it.productSku && <p className="text-xs text-gray-400">SKU: {it.productSku}</p>}
                      </td>
                      <td className="py-2 text-center text-gray-600 dark:text-slate-400">{it.quantity}</td>
                      <td className="py-2 text-right text-gray-600 dark:text-slate-400">{cur}{Number(it.unitPrice).toLocaleString('es-AR')}</td>
                      <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{cur}{Number(it.subtotal).toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400">
                  <span>Subtotal</span><span>{cur}{Number(ticket.subtotal).toLocaleString('es-AR')}</span>
                </div>
                {ticket.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Descuento</span><span>-{cur}{Number(ticket.discount).toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
                  <span>TOTAL</span><span>{cur}{Number(ticket.total).toLocaleString('es-AR')}</span>
                </div>
                {ticket.paymentMethod && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-right">Forma de pago: {ticket.paymentMethod}</p>
                )}
              </div>

              {ticket.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-400 dark:text-slate-500 italic">{ticket.notes}</p>
                </div>
              )}

              {config?.footer && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-center">
                  <p className="text-xs text-gray-400 dark:text-slate-500">{config.footer}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

function buildTicketHtml(ticket, config) {
  const cur = config?.currency || '$'
  const biz = config?.businessName || 'Mi tienda'
  const rows = (ticket.items || []).map(it =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">${it.productName}${it.size ? ` <span style="color:#9ca3af">(${it.size})</span>` : ''}</td>
     <td style="padding:6px 0;text-align:center;border-bottom:1px solid #f3f4f6;">${it.quantity}</td>
     <td style="padding:6px 0;text-align:right;border-bottom:1px solid #f3f4f6;">${cur}${Number(it.unitPrice).toLocaleString('es-AR')}</td>
     <td style="padding:6px 0;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:600;">${cur}${Number(it.subtotal).toLocaleString('es-AR')}</td></tr>`
  ).join('')

  return `<strong>${biz}</strong> — ${ticket.ticketNumber}<br>
    ${new Date(ticket.createdAt).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}<br><br>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead><tr style="font-size:12px;color:#9ca3af">
        <th align="left">Producto</th><th>Cant.</th><th align="right">Precio</th><th align="right">Subtotal</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table><br>
    <strong>Total: ${cur}${Number(ticket.total).toLocaleString('es-AR')}</strong>
    ${ticket.paymentMethod ? `<br>Forma de pago: ${ticket.paymentMethod}` : ''}
    ${config?.footer ? `<br><br><em>${config.footer}</em>` : ''}`
}
