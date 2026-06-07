import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { catalogsApi } from '../api/catalogs'

function QRModal({ catalogId, catalogName, onClose }) {
  const url = `${window.location.origin}/c/${catalogId}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">QR — {catalogName}</h3>
        <img src={qrSrc} alt="QR" className="w-48 h-48 rounded-xl" />
        <p className="text-xs text-gray-400 text-center break-all">{url}</p>
        <a href={qrSrc} download={`qr-${catalogName}.png`}
          className="w-full py-2 text-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
          Descargar QR
        </a>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">Cerrar</button>
      </div>
    </div>
  )
}

const STATUS_LABEL = {
  DRAFT: 'Borrador',
  GENERATING: 'Generando...',
  GENERATED: 'Generado',
}

const STATUS_COLOR = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
  GENERATING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  GENERATED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

export default function CatalogsPage() {
  const navigate = useNavigate()
  const [catalogs, setCatalogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [showForm, setShowForm] = useState(false)
  const [qrCatalog, setQrCatalog] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const { data } = await catalogsApi.list()
      setCatalogs(data)
    } catch {
      toast.error('No se pudo cargar los catálogos')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const { data } = await catalogsApi.create(form)
      toast.success('Catálogo creado')
      navigate(`/catalogs/${data.id}`)
    } catch {
      toast.error('Error al crear catálogo')
      setCreating(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`¿Eliminar el catálogo "${name}"?`)) return
    try {
      await catalogsApi.remove(id)
      setCatalogs(c => c.filter(x => x.id !== id))
      toast.success('Catálogo eliminado')
    } catch {
      toast.error('Error al eliminar catálogo')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogos</h1>
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            + Nuevo catálogo
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Nuevo catálogo</h2>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Catálogo Primavera 2025"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripción opcional..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div>
        ) : catalogs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 text-sm">No hay catálogos todavía.</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Creá uno para empezar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {catalogs.map(catalog => (
              <div
                key={catalog.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                onClick={() => navigate(`/catalogs/${catalog.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{catalog.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[catalog.status]}`}>
                      {STATUS_LABEL[catalog.status]}
                    </span>
                  </div>
                  {catalog.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{catalog.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {catalog.productCount} {catalog.productCount === 1 ? 'producto' : 'productos'}
                    </p>
                    {catalog.viewCount > 0 && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {catalog.viewCount} {catalog.viewCount === 1 ? 'vista' : 'vistas'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); setQrCatalog(catalog) }}
                    className="p-2 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    title="Ver QR"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(catalog.id, catalog.name) }}
                    className="p-2 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {qrCatalog && (
        <QRModal
          catalogId={qrCatalog.id}
          catalogName={qrCatalog.name}
          onClose={() => setQrCatalog(null)}
        />
      )}
    </Layout>
  )
}
