import React, { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../api/axios'

const TIMEOUT = 30000

const FREE_MODELS = {
  openrouter: [
    'mistralai/mistral-7b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'google/gemma-3-4b-it:free',
    'qwen/qwen3-8b:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'meta-llama/llama-3.3-70b-instruct:free',
  ],
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ],
}

async function withTimeout(fn) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout (20s)')), TIMEOUT)),
  ])
}

export default function AdminDiagnosticsPage() {
  const [entries, setEntries] = useState([])
  const [running, setRunning] = useState({})
  const [provider, setProvider] = useState('openrouter')
  const [model, setModel] = useState('google/gemini-2.0-flash-exp:free')

  function addEntry(label, status, data) {
    setEntries(prev => [...prev, { label, status, data, ts: new Date().toLocaleTimeString('es-AR') }])
  }

  function setRun(key, val) { setRunning(prev => ({ ...prev, [key]: val })) }

  async function runOne(key, label, fn) {
    setRun(key, true)
    try {
      const data = await withTimeout(fn)
      addEntry(label, 'ok', data)
    } catch (e) {
      addEntry(label, 'error', e.response?.data ?? e.message)
    } finally {
      setRun(key, false)
    }
  }

  function testAi() {
    const label = `Test IA — ${provider} / ${model}`
    runOne('test', label, async () => {
      const { data } = await api.get('/admin/ai/test', { params: { provider, model } })
      return data
    })
  }

  async function runAll() {
    setEntries([])
    await runOne('health', 'GET /api/health', async () => {
      const { data } = await api.get('/health'); return data
    })
    await runOne('models', 'GET /api/health/ai-models', async () => {
      const { data } = await api.get('/health/ai-models'); return data
    })
    await runOne('test', `Test IA — ${provider} / ${model}`, async () => {
      const { data } = await api.get('/admin/ai/test', { params: { provider, model } }); return data
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

        {/* Selector de proveedor y modelo */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 mb-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Probar modelo específico</p>
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Proveedor</label>
              <select value={provider} onChange={e => {
                setProvider(e.target.value)
                setModel(FREE_MODELS[e.target.value][0])
              }}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="openrouter">OpenRouter (free)</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Modelo</label>
              <select value={model} onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {FREE_MODELS[provider].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="O escribí el modelo manualmente..."
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={testAi} disabled={running.test}
              className="px-4 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-colors whitespace-nowrap">
              {running.test ? '...' : 'Probar este modelo'}
            </button>
          </div>
        </div>

        {/* Botones individuales */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button onClick={() => runOne('health', 'GET /api/health', async () => { const { data } = await api.get('/health'); return data })}
            disabled={running.health}
            className="py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 disabled:opacity-50 transition-colors">
            {running.health ? '...' : 'Health'}
          </button>
          <button onClick={() => runOne('models', 'Modelos Gemini', async () => { const { data } = await api.get('/health/ai-models'); return data })}
            disabled={running.models}
            className="py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 disabled:opacity-50 transition-colors">
            {running.models ? '...' : 'Modelos Gemini'}
          </button>
          <button onClick={() => runOne('ormodels', 'Modelos OpenRouter (free)', async () => { const { data } = await api.get('/health/openrouter-models'); return data })}
            disabled={running.ormodels}
            className="py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 disabled:opacity-50 transition-colors">
            {running.ormodels ? '...' : 'Modelos OpenRouter'}
          </button>
        </div>

        {entries.length === 0 && !anyRunning && (
          <p className="text-gray-400 dark:text-slate-500 text-sm">Seleccioná proveedor/modelo y presioná "Probar este modelo", o "Ejecutar todo".</p>
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
