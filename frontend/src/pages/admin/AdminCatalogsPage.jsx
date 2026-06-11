import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'

const STATUS_LABEL = { DRAFT: 'Borrador', GENERATING: 'Generando', GENERATED: 'Generado' }
const STATUS_COLOR = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
  GENERATING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  GENERATED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

function ConfirmModal({ modal, onConfirm, onClose }) {
  if (!modal) return null
  const { title, description, confirmLabel, danger } = modal
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${danger ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} className={`flex-1 py-2 text-white font-semibold rounded-xl text-sm transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
            {confirmLabel}
          </button>
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCatalogsPage() {
  const [catalogs, setCatalogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await adminApi.catalogs()
      setCatalogs(data)
    } catch {
      toast.error('Error al cargar catálogos')
    } finally {
      setLoading(false)
    }
  }

  function confirmToggleActive(catalog) {
    const blocking = catalog.active
    setConfirmModal({
      title: blocking ? `¿Bloquear "${catalog.name}"?` : `¿Activar "${catalog.name}"?`,
      description: blocking
        ? 'El catálogo dejará de ser visible al público hasta que lo reactives.'
        : 'El catálogo volverá a ser visible al público.',
      confirmLabel: blocking ? 'Bloquear' : 'Activar',
      danger: blocking,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.toggleCatalogActive(catalog.id)
          setCatalogs(c => c.map(x => x.id === catalog.id ? { ...x, active: data.active } : x))
        } catch {
          toast.error('Error al cambiar estado del catálogo')
        }
      },
    })
  }

  async function handleDelete(id, name) {
    if (!confirm(`¿Eliminar el catálogo "${name}" y todos sus productos?`)) return
    try {
      await adminApi.deleteCatalog(id)
      setCatalogs(c => c.filter(x => x.id !== id))
      toast.success('Catálogo eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const filtered = catalogs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ownerEmail || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <ConfirmModal modal={confirmModal} onConfirm={confirmModal?.onConfirm} onClose={() => setConfirmModal(null)} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogos</h1>
        <span className="text-sm text-gray-400 dark:text-slate-500">{catalogs.length} en total</span>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o vendedor..."
        className="w-full max-w-sm px-3 py-2 mb-4 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Catálogo</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Vendedor</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Productos</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Vistas</th>
                <th className="px-4 py-3 text-center">Estado IA</th>
                <th className="px-4 py-3 text-center">Visible</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">ID {c.id}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-700 dark:text-slate-300 text-sm">{c.ownerName}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{c.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-600 dark:text-slate-400">
                    {c.productCount}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-600 dark:text-slate-400">
                    {c.viewCount ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status]}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => confirmToggleActive(c)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        c.active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200'
                      }`}
                    >
                      {c.active ? 'Activo' : 'Bloqueado'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {c.publicId && (
                        <a
                          href={`/c/${c.publicId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          title="Ver catálogo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">No hay resultados.</p>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
