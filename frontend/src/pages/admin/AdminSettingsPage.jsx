import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'

const FREE_MODELS = {
  openrouter: [
    'liquid/lfm-2.5-1.2b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-4-26b-a4b-it:free',
    'openai/gpt-oss-20b:free',
    'qwen/qwen3-coder:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
  ],
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ],
}

export default function AdminSettingsPage() {
  const [provider, setProvider] = useState('openrouter')
  const [model, setModel] = useState(FREE_MODELS.openrouter[0])
  const [geminiKeySet, setGeminiKeySet] = useState(false)
  const [openrouterKeySet, setOpenrouterKeySet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.aiConfig()
      .then(({ data }) => {
        setProvider(data.provider)
        setModel(data.model)
        setGeminiKeySet(data.geminiKeySet)
        setOpenrouterKeySet(data.openrouterKeySet)
      })
      .catch(() => toast.error('Error al cargar la configuracion de IA'))
      .finally(() => setLoading(false))
  }, [])

  function handleProviderChange(e) {
    const p = e.target.value
    setProvider(p)
    setModel(FREE_MODELS[p][0])
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await adminApi.saveAiConfig({ provider, model })
      setProvider(data.provider)
      setModel(data.model)
      setGeminiKeySet(data.geminiKeySet)
      setOpenrouterKeySet(data.openrouterKeySet)
      toast.success('Configuracion guardada')
    } catch {
      toast.error('Error al guardar la configuracion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuracion</h1>

        {/* Seccion IA */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Configuracion de IA</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
            Proveedor y modelo activos para generacion de bios, descripciones e intros de catalogo.
          </p>

          {/* Estado de las keys */}
          <div className="flex gap-3 mb-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              openrouterKeySet
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${openrouterKeySet ? 'bg-green-500' : 'bg-red-500'}`} />
              OpenRouter key {openrouterKeySet ? 'configurada' : 'no configurada'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              geminiKeySet
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${geminiKeySet ? 'bg-green-500' : 'bg-red-500'}`} />
              Gemini key {geminiKeySet ? 'configurada' : 'no configurada'}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">Cargando...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Proveedor
                </label>
                <select
                  value={provider}
                  onChange={handleProviderChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>

              {/* Modelo (lista) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Modelo
                </label>
                <select
                  value={FREE_MODELS[provider].includes(model) ? model : ''}
                  onChange={e => setModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FREE_MODELS[provider].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {!FREE_MODELS[provider].includes(model) && model && (
                    <option value={model}>{model} (personalizado)</option>
                  )}
                </select>
              </div>

              {/* Modelo (manual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  O escribi el modelo manualmente
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="ej: liquid/lfm-2.5-1.2b-instruct:free"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Seccion Diagnostico */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Diagnostico</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Verificar conectividad con los proveedores de IA y listar modelos disponibles.
          </p>
          <Link
            to="/admin/diagnostics"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
            Ir a Diagnostico de IA
          </Link>
        </section>
      </div>
    </AdminLayout>
  )
}
