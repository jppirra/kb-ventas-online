import React, { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../api/axios'

export default function AdminDiagnosticsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  function log(msg, type = 'info') {
    const ts = new Date().toLocaleTimeString('es-AR')
    setLogs(prev => [...prev, { ts, msg, type }])
  }

  function clear() { setLogs([]) }

  async function checkHealth() {
    log('→ GET /api/health', 'info')
    try {
      const { data } = await api.get('/health')
      log(`status: ${data.status}`, 'ok')
      log(`version: ${data.version}`, 'ok')
      log(`geminiModel: ${data.geminiModel}`, 'ok')
      log(`geminiKeySet: ${data.geminiKeySet}`, data.geminiKeySet === 'SI' ? 'ok' : 'error')
    } catch (e) {
      log(`ERROR: ${e.response?.status} ${JSON.stringify(e.response?.data)}`, 'error')
    }
  }

  async function checkModels() {
    log('→ GET /api/health/ai-models', 'info')
    try {
      const { data } = await api.get('/health/ai-models')
      if (!data.length) { log('Sin modelos devueltos', 'warn'); return }
      data.forEach(m => log(m, m.startsWith('ERROR') ? 'error' : 'ok'))
    } catch (e) {
      log(`ERROR: ${e.response?.status} ${JSON.stringify(e.response?.data)}`, 'error')
    }
  }

  async function testAi() {
    log('→ GET /api/admin/ai/test', 'info')
    try {
      const { data } = await api.get('/admin/ai/test')
      log(`result: ${data.result}`, data.result?.startsWith('OK') ? 'ok' : 'error')
    } catch (e) {
      log(`ERROR: ${e.response?.status} ${JSON.stringify(e.response?.data)}`, 'error')
    }
  }

  async function runAll() {
    setLoading(true)
    clear()
    await checkHealth()
    await checkModels()
    await testAi()
    setLoading(false)
  }

  const COLOR = {
    info:  'text-blue-400',
    ok:    'text-green-400',
    warn:  'text-yellow-400',
    error: 'text-red-400',
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnóstico IA</h1>
          <div className="flex gap-2">
            <button onClick={clear}
              className="px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              Limpiar
            </button>
            <button onClick={runAll} disabled={loading}
              className="px-4 py-1.5 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors">
              {loading ? 'Ejecutando...' : 'Ejecutar todo'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={checkHealth}
            className="py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors">
            Health
          </button>
          <button onClick={checkModels}
            className="py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors">
            Modelos disponibles
          </button>
          <button onClick={testAi}
            className="py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors">
            Test IA
          </button>
        </div>

        <div className="bg-gray-950 rounded-2xl p-4 min-h-64 font-mono text-sm overflow-auto">
          {logs.length === 0 && (
            <p className="text-gray-600">Presioná "Ejecutar todo" o un botón individual...</p>
          )}
          {logs.map((l, i) => (
            <div key={i} className={`${COLOR[l.type]} leading-relaxed`}>
              <span className="text-gray-600 mr-2">{l.ts}</span>{l.msg}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
