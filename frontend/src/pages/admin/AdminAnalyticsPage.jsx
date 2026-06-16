import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../api/axios'
import { toast } from 'sonner'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

function StatCard({ label, value, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 ${onClick ? 'cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors' : ''}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {onClick && <p className="text-xs text-indigo-400 mt-1">Ver listado</p>}
    </div>
  )
}

function ActiveUsersPanel({ days, onClose }) {
  const [users, setUsers] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/app/active-users?days=${days}`)
      .then(r => setUsers(r.data))
      .catch(() => toast.error('No se pudo cargar la lista de usuarios'))
      .finally(() => setLoading(false))

    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [days, onClose])

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
            Usuarios activos ({days}d) — {users ? users.length : '…'} usuarios
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-4">
          {loading ? (
            <p className="text-gray-400 dark:text-slate-500 text-sm">Cargando...</p>
          ) : users && users.length > 0 ? (
            <div className="space-y-2">
              {users.map((u, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {String(u.name || u.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.email}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {u.eventCount} eventos · último: {u.lastSeen ? new Date(u.lastSeen).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-slate-500 text-sm">Sin usuarios en este período.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function BreakdownBar({ data }) {
  if (!data || Object.keys(data).length === 0)
    return <p className="text-sm text-gray-400">Sin datos</p>
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, val]) => (
        <div key={key}>
          <div className="flex justify-between text-xs text-gray-600 dark:text-slate-400 mb-0.5">
            <span>{key}</span>
            <span>{val} ({total > 0 ? Math.round(val / total * 100) : 0}%)</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: total > 0 ? `${val / total * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
      {children}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [activeUsersPanel, setActiveUsersPanel] = useState(null)

  const loadData = () => {
    setLoading(true)
    api.get('/app/summary')
      .then(r => setData(r.data))
      .catch(() => toast.error('No se pudo cargar el resumen de analytics.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleReset = () => {
    setResetting(true)
    api.delete('/app/reset')
      .then(() => { setConfirmReset(false); loadData() })
      .catch(() => toast.error('No se pudo reiniciar los analytics.'))
      .finally(() => setResetting(false))
  }

  const dauChartData = (data?.dailyActiveUsers || []).map(d => ({
    fecha: d.date?.slice(5),
    usuarios: Number(d.count),
  }))

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Ultimos 30 dias — datos propios en tu base de datos</p>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Reiniciar datos
        </button>
      </div>

      {confirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Reiniciar analytics</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
              Esto borrara <strong>todos</strong> los eventos registrados. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmReset(false)}
                disabled={resetting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {resetting ? 'Borrando...' : 'Si, borrar todo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando analytics...</div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Usuarios activos (7d)" value={data.activeUsers7d} onClick={() => setActiveUsersPanel(7)} />
            <StatCard label="Usuarios activos (30d)" value={data.activeUsers30d} onClick={() => setActiveUsersPanel(30)} />
            <StatCard label="Eventos totales (30d)" value={data.totalEvents30d} sub="en la base de datos" />
          </div>

          {dauChartData.length > 0 && (
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">Usuarios activos por dia</h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dauChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="usuarios" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Paginas mas visitadas</h4>
              {data.topPages?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
                      <th className="text-left pb-2">Ruta</th>
                      <th className="text-right pb-2">Visitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((p, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50">
                        <td className="py-1.5 font-mono text-xs text-gray-600 dark:text-slate-400">{p.page}</td>
                        <td className="py-1.5 text-right text-gray-700 dark:text-slate-300">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-gray-400">Sin datos</p>}
            </Card>

            <Card>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Eventos</h4>
              <BreakdownBar data={data.eventTypeBreakdown} />
            </Card>

            <Card>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Dispositivos</h4>
              <BreakdownBar data={data.deviceBreakdown} />
            </Card>

            <Card>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Browsers</h4>
              <BreakdownBar data={data.browserBreakdown} />
            </Card>

            <Card>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Sistema operativo</h4>
              <BreakdownBar data={data.osBreakdown} />
            </Card>
          </div>
        </div>
      ) : null}

      {activeUsersPanel && (
        <ActiveUsersPanel days={activeUsersPanel} onClose={() => setActiveUsersPanel(null)} />
      )}
    </AdminLayout>
  )
}
