import React, { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../api/axios'

export default function AdminDiagnosticsPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  function addEntry(label, status, data) {
    setEntries(prev => [...prev, { label, status, data, ts: new Date().toLocaleTimeString('es-AR') }])
  }

  async function runAll() {
    setEntries([])
    setLoading(true)

    // Health
    try {
      const { data } = await api.get('/health')
      addEntry('GET /api/health', 'ok', data)
    } catch (e) {
      addEntry('GET /api/health', 'error', e.response?.data || e.message)
    }

    // Models
    try {
      const { data } = await api.get('/health/ai-models')
      addEntry('GET /api/health/ai-models', 'ok', data)
    } catch (e) {
      addEntry('GET /api/health/ai-models', 'error', e.response?.data || e.message)
    }

    // AI test
    try {
      const { data } = await api.get('/admin/ai/test')
      addEntry('GET /api/admin/ai/test', 'ok', data)
    } catch (e) {
      addEntry('GET /api/admin/ai/test', 'error', e.response?.data || e.message)
    }

    setLoading(false)
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnóstico IA</h1>
          <button onClick={runAll} disabled={loading}
            className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors">
            {loading ? 'Ejecutando...' : 'Ejecutar diagnóstico'}
          </button>
        </div>

        {entries.length === 0 && !loading && (
          <div className="text-gray-400 dark:text-slate-500 text-sm">
            Presioná "Ejecutar diagnóstico" para ver los resultados.
          </div>
        )}

        <div className="space-y-4">
          {entries.map((e, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${
              e.status === 'ok'
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-semibold text-gray-800 dark:text-white">{e.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-slate-500">{e.ts}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    e.status === 'ok'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-400'
                  }`}>
                    {e.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <pre className="text-xs bg-gray-900 text-gray-100 rounded-xl p-3 overflow-auto whitespace-pre-wrap break-all">
                {JSON.stringify(e.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
