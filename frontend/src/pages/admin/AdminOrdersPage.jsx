import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'

const STATUS_LABEL = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'En proceso',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}
const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  IN_PROGRESS: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function ItemsTooltip({ json }) {
  try {
    const items = JSON.parse(json)
    if (!Array.isArray(items) || items.length === 0) return <span className="text-gray-400">—</span>
    return (
      <ul className="text-xs text-gray-600 dark:text-slate-400 space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="truncate max-w-[180px]">
            {it.quantity}× {it.productName}
            {it.offerPrice != null
              ? ` — $${Number(it.offerPrice).toLocaleString('es-AR')}`
              : it.price != null
              ? ` — $${Number(it.price).toLocaleString('es-AR')}`
              : ''}
          </li>
        ))}
      </ul>
    )
  } catch {
    return <span className="text-gray-400 text-xs">—</span>
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await adminApi.orders()
      setOrders(data)
    } catch {
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.vendorName || '').toLowerCase().includes(q) ||
      (o.vendorEmail || '').toLowerCase().includes(q) ||
      (o.catalogName || '').toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const totals = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
        <span className="text-sm text-gray-400 dark:text-slate-500">{orders.length} en total</span>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total', value: totals.all, color: 'text-gray-900 dark:text-white' },
          { label: 'Pendientes', value: totals.pending, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Entregados', value: totals.delivered, color: 'text-green-600 dark:text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente, vendedor o catálogo..."
          className="flex-1 min-w-[200px] max-w-sm px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Vendedor</th>
                  <th className="px-4 py-3 text-left">Catálogo</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Cliente</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Productos</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs font-mono">#{o.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{o.vendorName}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{o.vendorEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-sm">{o.catalogName || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-700 dark:text-slate-300 text-sm">{o.customerName || 'Sin nombre'}</p>
                      {o.customerPhone && <p className="text-xs text-gray-400 dark:text-slate-500">{o.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <ItemsTooltip json={o.itemsJson} />
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell font-medium text-gray-900 dark:text-white text-sm">
                      {o.total != null ? `$${Number(o.total).toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm">
              {search || statusFilter ? 'Sin resultados.' : 'No hay pedidos todavía.'}
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
