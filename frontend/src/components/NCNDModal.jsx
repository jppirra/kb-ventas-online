import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ticketsApi } from '../api/tickets'

const emptyItem = { productId: null, productName: '', productSku: '', quantity: 1, unitPrice: '' }

export default function NCNDModal({ tipo, refTicket, config, onClose, onCreated }) {
  const isNC = tipo === 'NC'
  const cur = config?.currency || '$'
  const tipoLetra = config?.tipoComprobante || ''

  const [concept, setConcept] = useState('')
  const [items, setItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState(
    (config?.paymentMethods || 'Efectivo').split(',')[0].trim()
  )
  const [discount, setDiscount] = useState('')
  const [saving, setSaving] = useState(false)

  const paymentOptions = useMemo(() =>
    (config?.paymentMethods || 'Efectivo').split(',').map(s => s.trim()).filter(Boolean)
  , [config])

  function importItems() {
    setItems((refTicket.items || []).map(it => ({
      productId: it.productId || null,
      productName: it.productName,
      productSku: it.productSku || '',
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
    })))
  }

  function addItem() { setItems(prev => [...prev, { ...emptyItem }]) }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function setItem(i, k, v) { setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it)) }

  const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1), 0)
  const discountAmt = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmt)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!concept.trim()) { toast.error('El concepto es obligatorio'); return }
    if (items.length === 0) { toast.error('Agregá al menos un item'); return }
    if (items.some(it => !it.productName.trim())) { toast.error('Completá la descripción de todos los items'); return }
    setSaving(true)
    try {
      const payload = {
        customerName: refTicket.customerName,
        customerDni: refTicket.customerDni,
        customerPhone: refTicket.customerPhone,
        customerEmail: refTicket.customerEmail,
        customerNotes: refTicket.customerNotes,
        paymentMethod,
        tipoDoc: tipo,
        referenceTicketNumber: refTicket.ticketNumber,
        discount: discountAmt || null,
        notes: concept,
        items: items.map((it, idx) => ({
          productId: it.productId || null,
          productName: it.productName,
          productSku: it.productSku || null,
          size: null, color: null,
          quantity: parseInt(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
          sortOrder: idx,
        }))
      }
      const { data } = await ticketsApi.create(payload)
      toast.success(`${tipo}${tipoLetra ? ' ' + tipoLetra : ''} ${data.ticketNumber} creada`)
      onCreated(data)
    } catch { toast.error('Error al crear el documento') }
    finally { setSaving(false) }
  }

  const title = isNC ? 'Nota de crédito' : 'Nota de débito'
  const conceptPlaceholder = isNC
    ? `Devolución de mercadería según Factura N° ${refTicket.ticketNumber}.\nBonificación comercial otorgada sobre Factura N° ${refTicket.ticketNumber}.`
    : `Cargo adicional por flete omitido en Factura N° ${refTicket.ticketNumber}.\nDiferencia de precio correspondiente a Factura N° ${refTicket.ticketNumber}.`

  const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  const accentCls = isNC
    ? { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', btn: 'bg-orange-500 hover:bg-orange-600', ring: 'focus:ring-orange-500' }
    : { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-500' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <form onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[92vh] flex flex-col">

        {/* Encabezado */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Ref: <span className="font-mono font-semibold text-gray-600 dark:text-slate-300">{refTicket.ticketNumber}</span>
              {refTicket.customerName && <span className="ml-2">— {refTicket.customerName}</span>}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            ✕
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Concepto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Concepto <span className="text-red-500">*</span>
              <span className="text-gray-400 dark:text-slate-500 font-normal ml-1">— ¿qué se ajusta, por qué y qué factura modifica?</span>
            </label>
            <textarea
              value={concept}
              onChange={e => setConcept(e.target.value)}
              placeholder={conceptPlaceholder}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700 dark:text-slate-300">
                Items <span className="text-red-500">*</span>
              </label>
              {(refTicket.items?.length ?? 0) > 0 && (
                <button type="button" onClick={importItems}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Importar de la factura original
                </button>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-2 mb-3">
                <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 64px 96px 80px 24px' }}>
                  <span className="text-xs text-gray-400 dark:text-slate-500">Descripción</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 text-center">Cant.</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 text-right">Precio unit.</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 text-right">Subtotal</span>
                  <span />
                </div>
                {items.map((it, i) => (
                  <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 64px 96px 80px 24px' }}>
                    <input type="text" placeholder="Descripción del item" value={it.productName}
                      onChange={e => setItem(i, 'productName', e.target.value)}
                      className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full" />
                    <input type="number" placeholder="1" value={it.quantity} min="1"
                      onChange={e => setItem(i, 'quantity', e.target.value)}
                      className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center w-full" />
                    <input type="number" placeholder="0.00" value={it.unitPrice} min="0" step="0.01"
                      onChange={e => setItem(i, 'unitPrice', e.target.value)}
                      className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-right w-full" />
                    <span className="text-xs font-medium text-gray-700 dark:text-slate-300 text-right">
                      {cur}{((parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1)).toLocaleString('es-AR')}
                    </span>
                    <button type="button" onClick={() => removeItem(i)}
                      className="text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={addItem}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar item
            </button>
          </div>

          {/* Forma de pago + Descuento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Forma de pago</label>
              {paymentOptions.length > 1 ? (
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
                  {paymentOptions.map(m => <option key={m}>{m}</option>)}
                </select>
              ) : (
                <input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls} />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Descuento ({cur})</label>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                min="0" step="0.01" placeholder="0" className={inputCls} />
            </div>
          </div>

          {/* Total */}
          <div className={`rounded-xl p-4 flex items-center justify-between ${accentCls.bg}`}>
            <div>
              <p className={`text-xs font-medium ${accentCls.text}`}>
                Total {isNC ? 'a acreditar al cliente' : 'a debitar al cliente'}
              </p>
              {discountAmt > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">Subtotal {cur}{subtotal.toLocaleString('es-AR')} — Descuento {cur}{discountAmt.toLocaleString('es-AR')}</p>
              )}
            </div>
            <span className={`text-2xl font-bold ${accentCls.text}`}>
              {cur}{total.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Pie */}
        <div className="flex gap-2 p-5 border-t border-gray-100 dark:border-slate-700 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className={`flex-1 py-2.5 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors ${accentCls.btn}`}>
            {saving ? 'Creando...' : `Crear ${tipo}${tipoLetra ? ' ' + tipoLetra : ''}`}
          </button>
        </div>
      </form>
    </div>
  )
}
