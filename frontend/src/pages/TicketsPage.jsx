import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import MpCheckoutModal from '../components/MpCheckoutModal'
import { ticketsApi } from '../api/tickets'
import { productsApi } from '../api/products'
import { customersApi } from '../api/customers'
import { fmtDate } from '../utils/date'
import { useAuth } from '../context/AuthContext'
import NCNDModal from '../components/NCNDModal'

function buildWaText(ticket, config) {
  const cur = config?.currency || '$'
  const biz = config?.businessName || 'Tienda'
  let text = `*Comprobante — ${biz}*\n`
  if (ticket.ticketNumber) text += `N°: ${ticket.ticketNumber}\n`
  text += `Fecha: ${fmtDate(ticket.createdAt)}\n\n*Detalle:*\n`
  ticket.items?.forEach(it => {
    const sub = (Number(it.unitPrice) * it.quantity).toLocaleString('es-AR')
    text += `• ${it.productName}${it.size ? ` (${it.size})` : ''} × ${it.quantity} — ${cur}${sub}\n`
  })
  text += `\n*Subtotal:* ${cur}${Number(ticket.subtotal).toLocaleString('es-AR')}\n`
  if (Number(ticket.discount) > 0) text += `*Descuento:* ${cur}${Number(ticket.discount).toLocaleString('es-AR')}\n`
  text += `*Total: ${cur}${Number(ticket.total).toLocaleString('es-AR')}*\n`
  if (ticket.paymentMethod) text += `\nForma de pago: ${ticket.paymentMethod}\n`
  if (config?.footer) text += `\n${config.footer}`
  return encodeURIComponent(text)
}

function RowMenu({ ticket, config, onAction }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isCancelled = ticket.status === 'CANCELLED'
  const isNC = ticket.tipoDoc === 'NC'
  const phone = ticket.customerPhone?.replace(/\D/g, '')
  const email = ticket.customerEmail

  const items = [
    { label: 'Abrir', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14', action: 'open', always: true },
    phone && { label: 'WhatsApp', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', action: 'wa', always: true, color: 'text-green-600 dark:text-green-400' },
    email && { label: 'Enviar email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', action: 'email', always: true, color: 'text-blue-500 dark:text-blue-400' },
    { label: 'Imprimir', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z', action: 'print', always: true },
    { label: 'Editar comprador', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', action: 'customer', always: true },
    !isCancelled && !isNC && { label: 'Nota de crédito', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', action: 'nc', color: 'text-orange-500' },
    !isCancelled && { label: 'Nota de débito', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', action: 'nd', color: 'text-blue-500' },
    !isCancelled && { label: 'Anular', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', action: 'cancel', color: 'text-red-500' },
  ].filter(Boolean)

  function handleItem(action) {
    setOpen(false)
    if (action === 'wa') {
      const waText = buildWaText(ticket, config)
      window.open(`https://wa.me/${phone}?text=${waText}`, '_blank')
      return
    }
    if (action === 'email') {
      onAction('email', ticket)
      return
    }
    if (action === 'print') {
      window.open(`/tickets/${ticket.id}`, '_blank')
      return
    }
    onAction(action, ticket)
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {items.map(item => (
            <button key={item.action} onClick={() => handleItem(item.action)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left ${item.color || 'text-gray-700 dark:text-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_LABELS = { PAID: 'Pagado', DRAFT: 'Borrador', CANCELLED: 'Cancelado' }
const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DRAFT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
const TIPODOC_LABELS = { COMP: null, NC: 'NC', ND: 'ND', TC: null }

const emptyItem = { productId: null, productName: '', productSku: '', variant: '', quantity: 1, unitPrice: '' }

function NewTicketModal({ onClose, onCreated }) {
  const [allProducts, setAllProducts] = useState([])
  const [allCustomers, setAllCustomers] = useState([])
  const [config, setConfig] = useState({ paymentMethods: 'Efectivo', currency: '$' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ customerName: '', customerDni: '', customerPhone: '', customerEmail: '', customerNotes: '', paymentMethod: '', discount: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    productsApi.list().then(r => setAllProducts(r.data || [])).catch(() => {})
    customersApi.list().then(r => setAllCustomers(r.data || [])).catch(() => {})
    ticketsApi.getConfig().then(r => {
      setConfig(r.data || {})
      const methods = (r.data?.paymentMethods || 'Efectivo').split(',').map(s => s.trim()).filter(Boolean)
      setForm(f => ({ ...f, paymentMethod: methods[0] || 'Efectivo' }))
    }).catch(() => {})
  }, [])

  const customerResults = useMemo(() => {
    if (!customerSearch.trim()) return []
    const q = customerSearch.toLowerCase()
    return allCustomers.filter(c =>
      c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [allCustomers, customerSearch])

  function selectCustomer(c) {
    setForm(f => ({ ...f, customerName: c.name, customerDni: c.dni || '', customerPhone: c.phone || '', customerEmail: c.email || '', customerNotes: c.notes || '' }))
    setCustomerSearch('')
    setShowCustomerResults(false)
  }

  const paymentOptions = useMemo(() => {
    const methods = (config.paymentMethods || 'Efectivo').split(',').map(s => s.trim()).filter(Boolean)
    if (config.mpEnabled && !methods.includes('Mercado Pago')) methods.push('Mercado Pago')
    return methods
  }, [config.paymentMethods, config.mpEnabled])

  const categories = useMemo(() =>
    [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort()
  , [allProducts])

  const filteredProducts = useMemo(() => {
    let r = allProducts
    if (selectedCategory) r = r.filter(p => p.category === selectedCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      r = r.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
    }
    return r.slice(0, 30)
  }, [allProducts, searchQuery, selectedCategory])

  function addProductToItems(product) {
    const existing = items.findIndex(it => it.productId === product.id && !it.variant)
    if (existing >= 0) {
      setItems(prev => prev.map((it, i) => i === existing ? { ...it, quantity: (parseInt(it.quantity) || 1) + 1 } : it))
      toast.success(`+1 ${product.name}`)
    } else {
      setItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        productSku: product.sku || '',
        variant: '',
        quantity: 1,
        unitPrice: product.offerPrice || product.price || '',
      }])
    }
  }

  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function setItem(i, field, value) { setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it)) }
  function addManualItem() { setItems(prev => [...prev, { ...emptyItem }]) }

  const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1), 0)
  const discount = parseFloat(form.discount) || 0
  const total = Math.max(0, subtotal - discount)

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.length === 0) { toast.error('Agregá al menos un producto'); return }
    if (items.some(it => !it.productName.trim())) { toast.error('Completá el nombre de todos los productos'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        discount: discount || null,
        items: items.map((it, idx) => {
          let size = null, color = null
          if (it.variant) {
            const sep = it.variant.indexOf(' / ')
            if (sep >= 0) { size = it.variant.slice(0, sep); color = it.variant.slice(sep + 3) }
            else size = it.variant
          }
          return { productId: it.productId || null, productName: it.productName, productSku: it.productSku || null, size, color, quantity: parseInt(it.quantity) || 1, unitPrice: parseFloat(it.unitPrice) || 0, sortOrder: idx }
        })
      }
      const { data } = await ticketsApi.create(payload)
      toast.success(`Ticket ${data.ticketNumber} creado`)
      onCreated(data)
    } catch { toast.error('Error al crear el ticket') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Nueva venta</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Buscador de productos */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                autoFocus
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button type="button" onClick={() => setSelectedCategory('')}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${!selectedCategory ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${selectedCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">Sin resultados</p>
              ) : filteredProducts.map(p => (
                <button key={p.id} type="button" onClick={() => addProductToItems(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    : <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-slate-600 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {p.sku && <span className="font-mono mr-2">{p.sku}</span>}
                      {p.category && <span>{p.category}</span>}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 shrink-0">
                    ${(p.offerPrice || p.price || 0).toLocaleString('es-AR')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Productos ({items.length})</span>
                <button type="button" onClick={addManualItem} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Línea manual</button>
              </div>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-slate-700/30 rounded-lg p-2">
                    <div className="col-span-12 sm:col-span-5">
                      <input type="text" placeholder="Producto *" value={item.productName}
                        onChange={e => setItem(i, 'productName', e.target.value)} required className={inputCls} />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <input type="text" placeholder="Talle / Color" value={item.variant}
                        onChange={e => setItem(i, 'variant', e.target.value)} className={inputCls} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <input type="number" min="1" placeholder="Cant." value={item.quantity}
                        onChange={e => setItem(i, 'quantity', e.target.value)} className={inputCls} />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input type="number" step="0.01" placeholder="Precio" value={item.unitPrice}
                        onChange={e => setItem(i, 'unitPrice', e.target.value)} className={inputCls} />
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-400 dark:text-slate-500 border border-dashed border-gray-200 dark:border-slate-600 rounded-xl">
              Escaneá un SKU o buscá un producto para agregar
            </div>
          )}

          {/* Totales */}
          {items.length > 0 && (
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
          )}

          {/* Forma de pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Forma de pago</label>
              {paymentOptions.length > 1 ? (
                <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {paymentOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input type="text" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  placeholder="Efectivo"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
          </div>

          {/* Cliente */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Datos del cliente</p>
            {allCustomers.length > 0 && (
              <div className="relative mb-3">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setShowCustomerResults(true) }}
                  onFocus={() => setShowCustomerResults(true)}
                  placeholder="Buscar cliente guardado..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showCustomerResults && customerResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
                    {customerResults.map(c => (
                      <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.phone || c.email || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="DNI / CUIT" value={form.customerDni} onChange={e => setForm(f => ({ ...f, customerDni: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="tel" placeholder="Teléfono WhatsApp" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email (opcional)" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Notas del cliente" value={form.customerNotes} onChange={e => setForm(f => ({ ...f, customerNotes: e.target.value }))}
                className="col-span-2 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || items.length === 0}
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
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [mpPaymentTicket, setMpPaymentTicket] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ q: '', dateFrom: '', dateTo: '', minTotal: '', maxTotal: '' })
  const [modal, setModal] = useState(null) // { type: 'cancel'|'customer'|'nc'|'nd', ticket }
  const [cancelReason, setCancelReason] = useState('')
  const [customerForm, setCustomerForm] = useState({})
  const [savingAction, setSavingAction] = useState(false)

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }
  function clearFilters() { setFilters({ q: '', dateFrom: '', dateTo: '', minTotal: '', maxTotal: '' }) }
  const hasFilters = Object.values(filters).some(v => v !== '')

  function openAction(type, ticket) {
    if (type === 'open') { navigate(`/tickets/${ticket.id}`); return }
    if (type === 'email') {
      ticketsApi.sendEmail(ticket.id)
        .then(() => toast.success(`Email enviado a ${ticket.customerEmail}`))
        .catch(() => toast.error('Error al enviar email'))
      return
    }
    if (type === 'customer') {
      setCustomerForm({ customerName: ticket.customerName || '', customerDni: ticket.customerDni || '', customerPhone: ticket.customerPhone || '', customerEmail: ticket.customerEmail || '', customerNotes: ticket.customerNotes || '' })
    }
    if (type === 'cancel') setCancelReason('')
    setModal({ type, ticket })
  }

  const isBeta = user?.appAdmin

  useEffect(() => {
    if (!isBeta) return
    Promise.all([ticketsApi.list(), ticketsApi.getConfig()])
      .then(([tr, cr]) => { setTickets(tr.data); setConfig(cr.data) })
      .catch(() => toast.error('Error al cargar tickets'))
      .finally(() => setLoading(false))
  }, [isBeta])

  async function handleCancelTicket() {
    setSavingAction(true)
    try {
      const { data } = await ticketsApi.cancel(modal.ticket.id, cancelReason)
      setTickets(ts => ts.map(t => t.id === data.id ? data : t))
      toast.success(`Comprobante ${data.ticketNumber} anulado`)
      setModal(null)
    } catch { toast.error('Error al anular') }
    finally { setSavingAction(false) }
  }

  async function handleSaveCustomer() {
    setSavingAction(true)
    try {
      const { data } = await ticketsApi.updateCustomer(modal.ticket.id, customerForm)
      setTickets(ts => ts.map(t => t.id === data.id ? data : t))
      toast.success('Comprador actualizado')
      setModal(null)
    } catch { toast.error('Error al actualizar') }
    finally { setSavingAction(false) }
  }


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

  const totalVentas = tickets
    .filter(t => t.status !== 'CANCELLED' && t.tipoDoc !== 'NC')
    .reduce((acc, t) => acc + Number(t.total), 0)

  const totalNC = tickets
    .filter(t => t.tipoDoc === 'NC' && t.status !== 'CANCELLED')
    .reduce((acc, t) => acc + Number(t.total), 0)

  const byPayment = tickets
    .filter(t => t.status === 'PAID' && t.tipoDoc !== 'NC' && t.paymentMethod)
    .reduce((acc, t) => {
      const m = t.paymentMethod
      acc[m] = (acc[m] || 0) + Number(t.total)
      return acc
    }, {})

  const ticketsFiltered = useMemo(() => {
    return tickets.filter(t => {
      if (filters.q) {
        const q = filters.q.toLowerCase()
        const match = t.ticketNumber?.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q) ||
          t.customerDni?.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filters.dateFrom && t.createdAt < filters.dateFrom) return false
      if (filters.dateTo && t.createdAt.slice(0, 10) > filters.dateTo) return false
      if (filters.minTotal !== '' && Number(t.total) < Number(filters.minTotal)) return false
      if (filters.maxTotal !== '' && Number(t.total) > Number(filters.maxTotal)) return false
      return true
    })
  }, [tickets, filters])

  return (
    <Layout>
      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={(ticket) => {
            setTickets(prev => [ticket, ...prev])
            setShowNew(false)
            if (ticket.paymentMethod === 'Mercado Pago' && config?.mpEnabled) {
              setMpPaymentTicket(ticket)
            } else {
              navigate(`/tickets/${ticket.id}`)
            }
          }}
        />
      )}
      {mpPaymentTicket && (
        <MpCheckoutModal
          ticket={mpPaymentTicket}
          onClose={() => {
            setMpPaymentTicket(null)
            navigate(`/tickets/${mpPaymentTicket.id}`)
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
              <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold rounded-full">Beta</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{tickets.length} comprobantes</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(v => !v)}
              className={`px-3 py-2 border text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5 ${hasFilters ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filtros{hasFilters ? ` (activos)` : ''}
            </button>
            <Link to="/tickets/config" className="px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
              Configurar
            </Link>
            <button onClick={() => setShowNew(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
              + Nueva venta
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Cliente / DNI / N° comprobante</label>
                <input
                  value={filters.q}
                  onChange={e => setFilter('q', e.target.value)}
                  placeholder="Buscar..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Desde</label>
                <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Hasta</label>
                <input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Total mínimo</label>
                <input type="number" value={filters.minTotal} onChange={e => setFilter('minTotal', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Total máximo</label>
                <input type="number" value={filters.maxTotal} onChange={e => setFilter('maxTotal', e.target.value)}
                  placeholder="Sin límite"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {hasFilters && (
                <div className="flex items-end">
                  <button onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
            {hasFilters && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                Mostrando {ticketsFiltered.length} de {tickets.length} comprobantes
              </p>
            )}
          </div>
        )}

        {/* Resumen de ventas */}
        {!loading && tickets.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
              <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Ventas</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">${totalVentas.toLocaleString('es-AR')}</p>
            </div>
            {totalNC > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Notas de crédito</p>
                <p className="text-xl font-bold text-orange-500 dark:text-orange-400">-${totalNC.toLocaleString('es-AR')}</p>
              </div>
            )}
            {Object.entries(byPayment).map(([method, amt]) => (
              <div key={method} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1 truncate">{method}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">${Number(amt).toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
        )}

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
        ) : ticketsFiltered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 text-sm">Sin resultados para los filtros aplicados.</p>
            <button onClick={clearFilters} className="mt-2 text-xs text-blue-500 hover:underline">Limpiar filtros</button>
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
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {ticketsFiltered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${t.id}`)}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{t.ticketNumber}</span>
                      {TIPODOC_LABELS[t.tipoDoc] && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded font-medium">{t.tipoDoc}</span>
                      )}
                    </td>
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
                      {t.cancellationReason && (
                        <p className="text-xs text-red-400 truncate max-w-[120px]" title={t.cancellationReason}>{t.cancellationReason}</p>
                      )}
                    </td>
                    <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                      <RowMenu ticket={t} config={config} onAction={openAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Anular */}
      {modal?.type === 'cancel' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Anular comprobante</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
              N° <span className="font-mono font-semibold">{modal.ticket.ticketNumber}</span> — el número <strong>no</strong> se reutilizará y el comprobante quedará visible como anulado.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo de anulación (obligatorio)..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleCancelTicket} disabled={!cancelReason.trim() || savingAction}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {savingAction ? 'Anulando...' : 'Anular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar comprador */}
      {modal?.type === 'customer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Editar comprador</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Nombre" value={customerForm.customerName}
                  onChange={e => setCustomerForm(f => ({ ...f, customerName: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="DNI / CUIT" value={customerForm.customerDni}
                  onChange={e => setCustomerForm(f => ({ ...f, customerDni: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input type="tel" placeholder="Teléfono WhatsApp" value={customerForm.customerPhone}
                onChange={e => setCustomerForm(f => ({ ...f, customerPhone: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email" value={customerForm.customerEmail}
                onChange={e => setCustomerForm(f => ({ ...f, customerEmail: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Notas" value={customerForm.customerNotes}
                onChange={e => setCustomerForm(f => ({ ...f, customerNotes: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveCustomer} disabled={savingAction}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                  {savingAction ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: NC / ND */}
      {(modal?.type === 'nc' || modal?.type === 'nd') && (
        <NCNDModal
          tipo={modal.type.toUpperCase()}
          refTicket={modal.ticket}
          config={config}
          onClose={() => setModal(null)}
          onCreated={(data) => {
            setTickets(ts => [data, ...ts])
            setModal(null)
            navigate(`/tickets/${data.id}`)
          }}
        />
      )}
    </Layout>
  )
}
