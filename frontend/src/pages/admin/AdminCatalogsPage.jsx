import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'
import { fmtDate } from '../../utils/date'

const STATUS_LABEL = { DRAFT: 'Borrador', GENERATING: 'Generando', GENERATED: 'Generado' }
const STATUS_COLOR = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
  GENERATING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  GENERATED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}
const ACTION_LABEL = { BLOCKED: 'Bloqueado', UNBLOCKED: 'Reactivado' }
const ACTION_COLOR = {
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  UNBLOCKED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function ConfirmModal({ modal, onClose }) {
  const [reason, setReason] = useState('')
  useEffect(() => { if (modal) setReason('') }, [modal])
  if (!modal) return null
  const { title, description, confirmLabel, danger, withReason, onConfirm } = modal

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
        {withReason && (
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Motivo de la acción (requerido)..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={withReason && !reason.trim()}
            className={`flex-1 py-2 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-40 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
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

function BulkActionBar({ count, onBlock, onActivate, onDelete, onClear }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 p-3 bg-blue-50 dark:bg-slate-700/60 rounded-xl border border-blue-200 dark:border-slate-600">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300 mr-1">{count} seleccionado{count !== 1 ? 's' : ''}</span>
      <button
        onClick={onBlock}
        className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
      >
        Bloquear
      </button>
      <button
        onClick={onActivate}
        className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
      >
        Activar
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        Eliminar
      </button>
      <button
        onClick={onClear}
        className="ml-auto px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
      >
        Limpiar selección
      </button>
    </div>
  )
}

function ModerationLogPanel({ catalog, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.catalogModerationLog(catalog.id)
      .then(r => setLogs(r.data))
      .catch(() => toast.error('Error al cargar historial'))
      .finally(() => setLoading(false))
  }, [catalog.id])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">Historial de moderación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">{catalog.name}</p>

        <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Estado actual:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[catalog.status] || ''}`}>
            {STATUS_LABEL[catalog.status] ?? catalog.status}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${catalog.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {catalog.active ? 'Visible' : 'Bloqueado'}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 space-y-0">
          {loading && <p className="text-sm text-gray-400 dark:text-slate-500">Cargando...</p>}
          {!loading && logs.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-3">Sin acciones de moderación registradas.</p>
          )}
          {!loading && logs.map((log, i) => (
            <div key={log.id} className="relative pl-6">
              <div className="absolute left-1.5 top-2 w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600" />
              {i < logs.length - 1 || catalog.createdAt
                ? <div className="absolute left-2.5 top-4 w-px h-full bg-gray-100 dark:bg-slate-700" />
                : null}
              <div className="pb-4">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLOR[log.action] || ''}`}>
                    {ACTION_LABEL[log.action] || log.action}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(log.createdAt)}</span>
                </div>
                {log.reason && (
                  <p className="text-sm text-gray-700 dark:text-slate-300 mt-1">"{log.reason}"</p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">por {log.adminName}</p>
              </div>
            </div>
          ))}
          {!loading && catalog.createdAt && (
            <div className="relative pl-6">
              <div className="absolute left-1.5 top-2 w-2 h-2 rounded-full bg-blue-300 dark:bg-blue-700" />
              <div className="pb-2">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Creado
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(catalog.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Catálogo creado como borrador</p>
              </div>
            </div>
          )}
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
  const [logCatalog, setLogCatalog] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const headerCheckRef = useRef(null)

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

  const filtered = catalogs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.ownerEmail || '').toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))
  const someSelected = filtered.some(c => selectedIds.has(c.id)) && !allSelected

  useEffect(() => {
    if (headerCheckRef.current) headerCheckRef.current.indeterminate = someSelected
  }, [someSelected])

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)))
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSearchChange(e) {
    setSearch(e.target.value)
    setSelectedIds(new Set())
  }

  // ── Single actions ──────────────────────────────────────────────────────────

  function confirmToggleActive(catalog) {
    const blocking = catalog.active
    setConfirmModal({
      title: blocking ? `¿Bloquear "${catalog.name}"?` : `¿Activar "${catalog.name}"?`,
      description: blocking
        ? 'El catálogo dejará de ser visible al público hasta que lo reactives.'
        : 'El catálogo volverá a ser visible al público.',
      confirmLabel: blocking ? 'Bloquear' : 'Activar',
      danger: blocking,
      withReason: true,
      onConfirm: async (reason) => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.toggleCatalogActive(catalog.id, reason)
          setCatalogs(c => c.map(x => x.id === catalog.id ? { ...x, active: data.active } : x))
          toast.success(blocking ? 'Catálogo bloqueado' : 'Catálogo reactivado')
        } catch {
          toast.error('Error al cambiar estado del catálogo')
        }
      },
    })
  }

  function confirmDelete(catalog) {
    setConfirmModal({
      title: `¿Eliminar "${catalog.name}"?`,
      description: 'Se eliminará el catálogo y todos sus productos. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      danger: true,
      withReason: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await adminApi.deleteCatalog(catalog.id)
          setCatalogs(c => c.filter(x => x.id !== catalog.id))
          setSelectedIds(prev => { const n = new Set(prev); n.delete(catalog.id); return n })
          toast.success('Catálogo eliminado')
        } catch {
          toast.error('Error al eliminar')
        }
      },
    })
  }

  // ── Bulk actions ────────────────────────────────────────────────────────────

  function confirmBulkBlock() {
    const ids = [...selectedIds]
    setConfirmModal({
      title: `¿Bloquear ${ids.length} catálogo${ids.length !== 1 ? 's' : ''}?`,
      description: 'Los catálogos seleccionados dejarán de ser visibles al público.',
      confirmLabel: 'Bloquear seleccionados',
      danger: false,
      withReason: true,
      onConfirm: async (reason) => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkBlockCatalogs(ids, reason)
          setCatalogs(c => c.map(x => ids.includes(x.id) ? { ...x, active: false } : x))
          setSelectedIds(new Set())
          toast.success(`${data.processed} bloqueado${data.processed !== 1 ? 's' : ''}${data.skipped ? `, ${data.skipped} omitido${data.skipped !== 1 ? 's' : ''}` : ''}`)
        } catch {
          toast.error('Error al bloquear catálogos')
        }
      },
    })
  }

  function confirmBulkActivate() {
    const ids = [...selectedIds]
    setConfirmModal({
      title: `¿Activar ${ids.length} catálogo${ids.length !== 1 ? 's' : ''}?`,
      description: 'Los catálogos seleccionados volverán a ser visibles al público.',
      confirmLabel: 'Activar seleccionados',
      danger: false,
      withReason: true,
      onConfirm: async (reason) => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkUnblockCatalogs(ids, reason)
          setCatalogs(c => c.map(x => ids.includes(x.id) ? { ...x, active: true } : x))
          setSelectedIds(new Set())
          toast.success(`${data.processed} activado${data.processed !== 1 ? 's' : ''}${data.skipped ? `, ${data.skipped} omitido${data.skipped !== 1 ? 's' : ''}` : ''}`)
        } catch {
          toast.error('Error al activar catálogos')
        }
      },
    })
  }

  function confirmBulkDelete() {
    const ids = [...selectedIds]
    setConfirmModal({
      title: `¿Eliminar ${ids.length} catálogo${ids.length !== 1 ? 's' : ''}?`,
      description: 'Se eliminarán los catálogos seleccionados y todos sus productos. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar seleccionados',
      danger: true,
      withReason: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkDeleteCatalogs(ids)
          setCatalogs(c => c.filter(x => !ids.includes(x.id)))
          setSelectedIds(new Set())
          toast.success(`${data.processed} eliminado${data.processed !== 1 ? 's' : ''}${data.skipped ? `, ${data.skipped} omitido${data.skipped !== 1 ? 's' : ''}` : ''}`)
        } catch {
          toast.error('Error al eliminar catálogos')
        }
      },
    })
  }

  return (
    <AdminLayout>
      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />
      {logCatalog && <ModerationLogPanel catalog={logCatalog} onClose={() => setLogCatalog(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogos</h1>
        <span className="text-sm text-gray-400 dark:text-slate-500">{catalogs.length} en total</span>
      </div>

      <input
        type="text"
        value={search}
        onChange={handleSearchChange}
        placeholder="Buscar por nombre o vendedor..."
        className="w-full max-w-sm px-3 py-2 mb-4 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onBlock={confirmBulkBlock}
          onActivate={confirmBulkActivate}
          onDelete={confirmBulkDelete}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left w-8">
                  <input
                    type="checkbox"
                    ref={headerCheckRef}
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
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
              {filtered.map(c => {
                const isSelected = selectedIds.has(c.id)
                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
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
                        <button
                          onClick={() => setLogCatalog(c)}
                          className="p-1.5 text-gray-400 hover:text-violet-500 dark:text-slate-500 dark:hover:text-violet-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          title="Historial de moderación"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
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
                        <a
                          href={`/catalogs/${c.id}`}
                          className="p-1.5 text-gray-400 hover:text-green-500 dark:text-slate-500 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          title="Editar catálogo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </a>
                        <button
                          onClick={() => confirmDelete(c)}
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
                )
              })}
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
