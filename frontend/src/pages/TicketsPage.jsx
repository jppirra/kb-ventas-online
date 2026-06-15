import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { ticketsApi } from '../api/tickets'
import { catalogsApi } from '../api/catalogs'
import { fmtDate } from '../utils/date'
import { useAuth } from '../context/AuthContext'

const STATUS_LABELS = { PAID: 'Pagado', DRAFT: 'Borrador', CANCELLED: 'Cancelado' }
const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DRAFT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const SIZE_PRESETS = [
  { label: 'Ropa adulto', sizes: ['XS','S','M','L','XL','XXL'] },
  { label: 'Ropa niño', sizes: ['2','4','6','8','10','12','14','16'] },
  { label: 'Calzado', sizes: ['34','35','36','37','38','39','40','41','42','43','44','45'] },
  { label: 'Talle único', sizes: ['Único'] },
]

const emptyItem = { productId: null, productName: '', productSku: '', variant: '', quantity: 1, unitPrice: '' }

function NewTicketModal({ onClose, onCreated }) {
  const [catalogs, setCatalogs] = useState([])
  const [selectedCatalog, setSelectedCatalog] = useState(null)
  const [items, setItems] = useState([{ ...emptyItem }])
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', customerNotes: '', paymentMethod: 'Efectivo', discount: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    catalogsApi.list().then(r => setCatalogs(r.data)).catch(() => {})
  }, [])

  const availableSizes = selectedCatalog?.sizesEnabled
    ? (selectedCatalog.sizeOptions ? selectedCatalog.sizeOptions.split(',').map(s => s.trim()).filter(Boolean) : [])
    : []
  const availableColors = selectedCatalog?.colorsEnabled
    ? (selectedCatalog.colorOptions ? selectedCatalog.colorOptions.split(',').map(s => s.trim()).filter(Boolean) : [])
    : []
  const availableVariants =
    availableSizes.length > 0 && availableColors.length > 0
      ? availableSizes.flatMap(s => availableColors.map(c => `${s} / ${c}`))
      : availableSizes.length > 0
        ? availableSizes
        : availableColors

  function addItem() { setItems(prev => [...prev, { ...emptyItem }]) }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function setItem(i, field, value) { setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it)) }

  function selectProduct(i, product) {
    setItem(i, 'productId', product.id)
    setItem(i, 'productName', product.name)
    setItem(i, 'productSku', product.sku || '')
    setItem(i, 'unitPrice', product.price ?? '')
  }

  const subtotal = items.reduce((acc, it) => {
    const price = parseFloat(it.unitPrice) || 0
    return acc + price * (parseInt(it.quantity) || 1)
  }, 0)
  const discount = parseFloat(form.discount) || 0
  const total = Math.max(0, subtotal - discount)

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.some(it => !it.productName.trim())) {
      toast.error('Completá el nombre de todos los productos')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        discount: discount || null,
        items: items.map((it, idx) => {
          let size = null, color = null
          if (it.variant) {
            if (availableSizes.length > 0 && availableColors.length > 0) {
              const sep = it.variant.indexOf(' / ')
              size = sep >= 0 ? it.variant.slice(0, sep) : it.variant
              color = sep >= 0 ? it.variant.slice(sep + 3) : null
            } else if (availableColors.length > 0) {
              color = it.variant
            } else {
              size = it.variant
            }
          }
          return {
            productId: it.productId || null,
            productName: it.productName,
            productSku: it.productSku || null,
            size,
            color,
            quantity: parseInt(it.quantity) || 1,
            unitPrice: parseFloat(it.unitPrice) || 0,
            sortOrder: idx,
          }
        })
      }
      const { data } = await ticketsApi.create(payload)
      toast.success(`Ticket ${data.ticketNumber} creado`)
      onCreated(data)
    } catch {
      toast.error('Error al crear el ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Nueva venta</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Catálogo (opcional para precargar productos) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Catálogo (opcional — para seleccionar productos)</label>
            <select value={selectedCatalog?.id || ''} onChange={e => setSelectedCatalog(catalogs.find(c => c.id === Number(e.target.value)) || null)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Sin catálogo —</option>
              {catalogs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Productos *</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Agregar línea</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  {/* Producto */}
                  <div className="col-span-12 sm:col-span-4">
                    {selectedCatalog?.products?.length > 0 ? (
                      <select value={item.productId || ''} onChange={e => {
                        const p = selectedCatalog.products.find(p => p.id === Number(e.target.value))
                        if (p) selectProduct(i, p); else setItem(i, 'productName', e.target.value)
                      }} className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Seleccionar...</option>
                        {selectedCatalog.products.map(p => {
                          const stockLabel = p.showStockQuantity && p.stockCount != null
                            ? ` — ${p.stockCount} en stock`
                            : p.showStock && p.stockStatus === 'ON_DEMAND'
                              ? ' — a pedido'
                              : ''
                          return <option key={p.id} value={p.id}>{p.name}{stockLabel}</option>
                        })}
                      </select>
                    ) : (
                      <input type="text" placeholder="Producto *" value={item.productName}
                        onChange={e => setItem(i, 'productName', e.target.value)} required
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    )}
                  </div>
                  {/* Variante (talle / color) */}
                  <div className="col-span-4 sm:col-span-3">
                    {availableVariants.length > 0 ? (
                      <select value={item.variant} onChange={e => setItem(i, 'variant', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Variante</option>
                        {availableVariants.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (
                      <input type="text" placeholder="Talle / Color" value={item.variant}
                        onChange={e => setItem(i, 'variant', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    )}
                  </div>
                  {/* Cantidad */}
                  <div className="col-span-2 sm:col-span-2">
                    <input type="number" min="1" placeholder="Cant." value={item.quantity}
                      onChange={e => setItem(i, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  {/* Precio */}
                  <div className="col-span-4 sm:col-span-2">
                    <input type="number" step="0.01" placeholder="Precio unit." value={item.unitPrice}
                      onChange={e => setItem(i, 'unitPrice', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  {/* Subtotal + eliminar */}
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-1">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      ${((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1)).toLocaleString('es-AR')}
                    </span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gray-50 dark:bg-slate-700/40 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-slate-400">
              <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
              <span>Descuento</span>
              <input type="number" step="0.01" min="0" value={form.discount} placeholder="0"
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                className="w-24 text-right px-2 py-0.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-slate-600 pt-1">
              <span>Total</span><span>${total.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Forma de pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Forma de pago</label>
              <input type="text" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                placeholder="Efectivo"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Datos del cliente (para registro y WhatsApp)</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="tel" placeholder="Teléfono WhatsApp" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email (opcional)" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Notas del cliente" value={form.customerNotes} onChange={e => setForm(f => ({ ...f, customerNotes: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
              {saving ? 'Guardando...' : 'Crear ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TicketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const isBeta = user?.appAdmin

  useEffect(() => {
    if (!isBeta) return
    ticketsApi.list()
      .then(r => setTickets(r.data))
      .catch(() => toast.error('Error al cargar tickets'))
      .finally(() => setLoading(false))
  }, [isBeta])

  if (!isBeta) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Beta
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Facturación</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-2">Esta función está en desarrollo. Próximamente podrás generar comprobantes de venta, enviarlos por WhatsApp y llevar el registro de tus clientes.</p>
          <p className="text-sm text-gray-400 dark:text-slate-500">Disponible pronto para todos los vendedores.</p>
        </div>
      </Layout>
    )
  }

  const total = tickets.reduce((acc, t) => acc + Number(t.total), 0)

  return (
    <Layout>
      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={(ticket) => {
            setTickets(prev => [ticket, ...prev])
            setShowNew(false)
            navigate(`/tickets/${ticket.id}`)
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
              <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold rounded-full">Beta</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{tickets.length} tickets · Total ${total.toLocaleString('es-AR')}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/tickets/config" className="px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
              Configurar
            </Link>
            <button onClick={() => setShowNew(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
              + Nueva venta
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 mb-4">Sin tickets todavía</p>
            <button onClick={() => setShowNew(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
              Registrar primera venta
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{t.ticketNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{t.customerName || '—'}</p>
                      {t.customerPhone && <p className="text-xs text-gray-400">{t.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{t.items?.length ?? 0} ítem(s)</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">${Number(t.total).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || ''}`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500">
                      {fmtDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
