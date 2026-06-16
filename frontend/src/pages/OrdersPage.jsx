import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import api from '../api/axios'
import { ordersApi } from '../api/orders'
import { fmtDateTime } from '../utils/date'

const STATUS_OPTIONS = [
  { value: 'PENDING',     label: 'Pendiente',    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'CONFIRMED',   label: 'Confirmado',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'IN_PROGRESS', label: 'En proceso',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'DELIVERED',   label: 'Entregado',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'CANCELLED',   label: 'Cancelado',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
]

function statusMeta(status) {
  return STATUS_OPTIONS.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-600' }
}

function parseItems(itemsJson) {
  try { return JSON.parse(itemsJson) || [] } catch { return [] }
}

function formatDate(dateStr) {
  return fmtDateTime(dateStr)
}

function OrderCard({ order, onUpdated }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    vendorNotes: order.vendorNotes || '',
    status: order.status || 'PENDING',
  })
  const [saving, setSaving] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [customerSaved, setCustomerSaved] = useState(false)

  async function handleSaveCustomer() {
    if (!order.customerName && !order.customerPhone) {
      toast.error('El pedido no tiene nombre ni teléfono del cliente')
      return
    }
    setSavingCustomer(true)
    try {
      await api.post('/customers', {
        name: order.customerName || 'Sin nombre',
        phone: order.customerPhone || '',
        source: 'order',
        orderId: order.id,
      })
      setCustomerSaved(true)
      toast.success('Cliente guardado')
    } catch (err) {
      if (err.response?.status === 409) {
        setCustomerSaved(true)
        toast.info('Ya estaba guardado como cliente')
      } else {
        toast.error('Error al guardar cliente')
      }
    } finally {
      setSavingCustomer(false)
    }
  }

  const items = parseItems(order.itemsJson)
  const meta = statusMeta(order.status)
  const customerLabel = order.customerName || 'Cliente anónimo'

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await ordersApi.update(order.id, form)
      onUpdated(updated.data)
      setEditing(false)
      toast.success('Pedido actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleWhatsapp() {
    const phone = form.customerPhone || order.customerPhone
    if (!phone) { toast.error('Ingresá el teléfono del cliente primero'); return }
    const itemLines = items.map(i => {
      const price = i.offerPrice ?? i.price
      return `• ${i.productName} × ${i.quantity}${price != null ? ` — $${Number(price).toLocaleString('es-AR')}` : ''}`
    }).join('\n')
    const name = form.customerName || order.customerName || ''
    const msg = encodeURIComponent(
      `Hola${name ? ' ' + name : ''}! Con respecto a tu pedido del catálogo "${order.catalogName}":\n\n${itemLines}\n\nTotal: $${Number(order.total).toLocaleString('es-AR')}`
    )
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header row */}
      <div
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{customerLabel}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
            {order.customerPhone && (
              <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {order.customerPhone}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-slate-400">{order.catalogName}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">·</span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {order.total != null ? `$${Number(order.total).toLocaleString('es-AR')}` : ''}
            </span>
            <span className="text-xs text-gray-400 dark:text-slate-500">·</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(order.createdAt)}</span>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-100 dark:border-slate-700 p-4 space-y-4">

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Productos</p>
            <div className="space-y-1.5">
              {items.map((item, i) => {
                const price = item.offerPrice ?? item.price
                return (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-slate-200">{item.productName} × {item.quantity}</span>
                    {price != null && (
                      <span className="text-gray-500 dark:text-slate-400">
                        ${(Number(price) * item.quantity).toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                )
              })}
              {order.total != null && (
                <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-blue-600 dark:text-blue-400">${Number(order.total).toLocaleString('es-AR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit form */}
          {editing ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Datos del cliente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Nombre del cliente</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="Nombre y apellido"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                    placeholder="Ej: 5491123456789"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setForm(f => ({ ...f, status: s.value }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        form.status === s.value
                          ? s.color + ' border-current'
                          : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Notas internas</label>
                <textarea
                  value={form.vendorNotes}
                  onChange={e => setForm(f => ({ ...f, vendorNotes: e.target.value }))}
                  rows={2}
                  placeholder="Notas visibles solo para vos..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {order.vendorNotes && (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Notas</p>
                  <p className="text-sm text-gray-700 dark:text-slate-200">{order.vendorNotes}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar datos / estado
                </button>
                <button onClick={handleWhatsapp}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl transition-colors">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Responder por WhatsApp
                </button>
                {(order.customerName || order.customerPhone) && (
                  <button onClick={handleSaveCustomer} disabled={savingCustomer || customerSaved}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                      customerSaved
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-default'
                        : 'border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    {customerSaved ? 'Cliente guardado' : savingCustomer ? 'Guardando...' : 'Guardar como cliente'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const STATUS_FILTER_OPTIONS = [{ value: '', label: 'Todos' }, ...STATUS_OPTIONS]

function exportToCSV(orders) {
  const rows = [
    ['ID', 'Cliente', 'Teléfono', 'Catálogo', 'Total', 'Estado', 'Fecha', 'Notas', 'Productos']
  ]
  orders.forEach(o => {
    const items = (() => { try { return JSON.parse(o.itemsJson) || [] } catch { return [] } })()
    const productsStr = items.map(i => `${i.productName} x${i.quantity}`).join(' | ')
    rows.push([
      o.id,
      o.customerName || '',
      o.customerPhone || '',
      o.catalogName || '',
      o.total != null ? Number(o.total).toFixed(2) : '',
      statusMeta(o.status).label,
      formatDate(o.createdAt),
      o.vendorNotes || '',
      productsStr,
    ])
  })
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    ordersApi.list()
      .then(r => setOrders(r.data))
      .catch(() => toast.error('Error al cargar pedidos'))
      .finally(() => setLoading(false))
  }, [])

  function handleUpdated(updated) {
    setOrders(os => os.map(o => o.id === updated.id ? updated : o))
  }

  const filtered = orders.filter(o => {
    const matchStatus = !statusFilter || o.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q) ||
      (o.catalogName || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const pendingCount = orders.filter(o => o.status === 'PENDING').length

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold rounded-full">
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
            {orders.length > 0 && (
              <button onClick={() => exportToCSV(filtered.length > 0 ? filtered : orders)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar CSV
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono o catálogo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTER_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === s.value
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                {s.label}
                {s.value === '' && ` (${orders.length})`}
                {s.value !== '' && ` (${orders.filter(o => o.status === s.value).length})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 text-sm">
              {orders.length === 0 ? 'Todavía no recibiste pedidos.' : 'Sin pedidos con ese filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onUpdated={handleUpdated} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
