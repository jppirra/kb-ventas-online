import React, { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../api/axios'

const TIMEOUT = 15000

async function callWithTimeout(fn) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout (15s)')), TIMEOUT))
  ])
}

export default function AdminDiagnosticsPage() {
  const [entries, setEntries] = useState([])
  const [running, setRunning] = useState({})

  function addEntry(label, status, data) {
    setEntries(prev => [...prev, { label, status, data, ts: new Date().toLocaleTimeString('es-AR') }])
  }

  function setRunningKey(key, val) {
    setRunning(prev => ({ ...prev, [key]: val }))
  }

  async function runOne(key, label, fn) {
    setRunningKey(key, true)
    try {
      const data = await callWithTimeout(fn)
      addEntry(label, 'ok', data)
    } catch (e) {
      addEntry(label, 'error', e.response?.data ?? e.message)
    } finally {
      setRunningKey(key, false)
    }
  }

  async function runAll() {
    setEntries([])
    await runOne('health', 'GET /api/health', async () => {
      const { data } = await api.get('/health')
      return data
    })
    await runOne('models', 'GET /api/health/ai-models', async () => {
      const { data } = await api.get('/health/ai-models')
      return data
    })
    await runOne('test', 'GET /api/admin/ai/test', async () => {
      const { data } = await api.get('/admin/ai/test')
      return data
    })
  }

  const anyRunning = Object.values(running).some(Boolean)

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnóstico IA</h1>
          <div className="flex gap-2">
            <button onClick={() => setEntries([])} disabled={anyRunning}
              className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
              Limpiar
            </button>
            <button onClick={runAll} disabled={anyRunning}
              className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors">
              {anyRunning ? 'Ejecutando...' : 'Ejecutar todo'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { key: 'health', label: 'Health', fn: async () => { const { data } = await api.get('/health'); return data } },
            { key: 'models', label: 'Modelos', fn: async () => { const { data } = await api.get('/health/ai-models'); return data } },
            { key: 'test',   label: 'Test IA', fn: async () => { const { data } = await api.get('/admin/ai/test'); return data } },
          ].map(({ key, label, fn }) => (
            <button key={key}
              onClick={() => runOne(key, `GET /api/${key === 'health' ? 'health' : key === 'models' ? 'health/ai-models' : 'admin/ai/test'}`, fn)}
              disabled={running[key]}
              className="py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 disabled:opacity-50 transition-colors">
              {running[key] ? '...' : label}
            </button>
          ))}
        </div>

        {entries.length === 0 && !anyRunning && (
          <p className="text-gray-400 dark:text-slate-500 text-sm">Presioná "Ejecutar todo" o un botón individual.</p>
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
                  <span className="text-xs text-gray-400">{e.ts}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    e.status === 'ok'
                      ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
                  }`}>{e.status.toUpperCase()}</span>
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
