import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { customersApi } from '../api/customers'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function fmtDate(s) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function waLink(phone) {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}`
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    customersApi.list(month || undefined)
      .then(r => setCustomers(r.data))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [month])

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.customerPhone || '').includes(q) ||
      (c.customerEmail || '').toLowerCase().includes(q)
    )
  })

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Historial de clientes registrados en tickets de venta.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 w-44"
            />
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            {month && (
              <button
                onClick={() => setMonth('')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 underline"
              >
                Ver todos
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            {customers.length === 0 ? 'Sin clientes registrados para este período.' : 'Sin resultados para la búsqueda.'}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Contacto</th>
                  <th className="text-right px-4 py-3">Compras</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Total</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Última</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{c.customerName || '—'}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 sm:hidden">
                        {c.customerPhone || c.customerEmail || ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-slate-300">
                      {c.customerPhone && <p>{c.customerPhone}</p>}
                      {c.customerEmail && <p className="text-xs text-gray-400 dark:text-slate-500">{c.customerEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {c.totalOrders}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-emerald-600 dark:text-emerald-400 font-semibold">
                      {fmtMoney(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-gray-400 dark:text-slate-500 text-xs">
                      {fmtDate(c.lastPurchaseAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.customerPhone && (
                        <a
                          href={waLink(c.customerPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Escribir por WhatsApp"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500">
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
              {month ? ` en el período seleccionado` : ` en total`}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
