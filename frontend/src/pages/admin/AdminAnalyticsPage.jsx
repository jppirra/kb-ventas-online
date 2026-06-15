import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../api/axios'
import { toast } from 'sonner'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
            <StatCard label="Usuarios activos (7d)" value={data.activeUsers7d} />
            <StatCard label="Usuarios activos (30d)" value={data.activeUsers30d} />
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
    </AdminLayout>
  )
}
