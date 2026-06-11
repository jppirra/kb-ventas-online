import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { storesApi } from '../api/stores'
import { catalogsApi } from '../api/catalogs'

const emptyForm = {
  name: '', slug: '', description: '', logoUrl: '', whatsappNumber: '', active: true,
}

export default function LocalesPage() {
  const [stores, setStores] = useState([])
  const [catalogs, setCatalogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const slugDebounce = useRef(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [storeRes, catRes] = await Promise.all([storesApi.list(), catalogsApi.list()])
      setStores(storeRes.data)
      setCatalogs(catRes.data)
    } catch {
      toast.error('Error al cargar locales')
    } finally {
      setLoading(false)
    }
  }

  function openForm(store = null) {
    if (store) {
      setEditingId(store.id)
      setForm({ name: store.name || '', slug: store.slug || '', description: store.description || '',
        logoUrl: store.logoUrl || '', whatsappNumber: store.whatsappNumber || '', active: store.active ?? true })
    } else {
      setEditingId(null)
      setForm(emptyForm)
    }
    setShowForm(true)
  }

  function handleNameChange(value) {
    setForm(f => ({ ...f, name: value }))
    if (editingId || form.slug) return
    clearTimeout(slugDebounce.current)
    if (!value.trim()) return
    slugDebounce.current = setTimeout(async () => {
      try {
        const { data } = await storesApi.slugSuggestion(value)
        setForm(f => f.slug ? f : { ...f, slug: data.slug })
      } catch { /* ignore */ }
    }, 600)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const { data } = await storesApi.update(editingId, form)
        setStores(ss => ss.map(s => s.id === editingId ? data : s))
        toast.success('Local actualizado')
      } else {
        const { data } = await storesApi.create(form)
        setStores(ss => [...ss, data])
        toast.success('Local creado')
      }
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar local')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este local? Los catálogos asociados quedarán sin local.')) return
    try {
      await storesApi.remove(id)
      setStores(ss => ss.filter(s => s.id !== id))
      toast.success('Local eliminado')
    } catch {
      toast.error('Error al eliminar local')
    }
  }

  async function handleAssignCatalog(storeId, catalogId, catalogName, storeName) {
    if (!confirm(`¿Asignar "${catalogName}" al local "${storeName}"?`)) return
    try {
      await storesApi.assignCatalog(storeId, catalogId)
      await loadAll()
      toast.success('Catálogo asignado al local')
    } catch {
      toast.error('Error al asignar catálogo')
    }
  }

  async function handleUnassignCatalog(catalogId, catalogName) {
    if (!confirm(`¿Quitar "${catalogName}" del local?`)) return
    try {
      await storesApi.unassignCatalog(catalogId)
      await loadAll()
      toast.success('Catálogo desasignado')
    } catch {
      toast.error('Error al desasignar catálogo')
    }
  }

  if (loading) return <Layout><div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div></Layout>

  const unassignedCatalogs = catalogs.filter(c => !c.storeId)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Locales</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Cada local tiene su propia URL pública con sus catálogos
            </p>
          </div>
          <button onClick={() => openForm()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
            + Nuevo local
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {editingId ? 'Editar local' : 'Nuevo local'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">URL del local (/s/...)</label>
                <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-700">
                  <span className="px-3 text-sm text-gray-400 dark:text-slate-500 shrink-0">/s/</span>
                  <input type="text" value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="mi-local"
                    className="flex-1 py-2 pr-3 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">WhatsApp</label>
                <input type="text" value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                  placeholder="5491112345678"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-2 self-end pb-2">
                <input type="checkbox" id="storeActive" checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
                <label htmlFor="storeActive" className="text-sm text-gray-700 dark:text-slate-300">Local activo</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {stores.length === 0 && !showForm ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 text-sm">No tienes locales. Crea el primero.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map(store => {
              const storeCatalogs = catalogs.filter(c => c.storeId === store.id)
              const publicUrl = `/s/${store.slug}`
              return (
                <div key={store.id} className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 ${!store.active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{store.name}</h3>
                        {!store.active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">Inactivo</span>
                        )}
                      </div>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline">/s/{store.slug}</a>
                      {store.description && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{store.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openForm(store)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(store.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Catálogos en este local</p>
                    <div className="space-y-1">
                      {storeCatalogs.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-xl">
                          <span className="text-sm text-gray-900 dark:text-white">{cat.name}</span>
                          <button onClick={() => handleUnassignCatalog(cat.id, cat.name)}
                            className="text-xs text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors">
                            Quitar
                          </button>
                        </div>
                      ))}
                      {storeCatalogs.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 px-1">Sin catálogos asignados</p>
                      )}
                    </div>
                    {unassignedCatalogs.length > 0 && (
                      <div className="mt-2">
                        <select
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) {
                              const cat = unassignedCatalogs.find(c => c.id === Number(e.target.value))
                              handleAssignCatalog(store.id, Number(e.target.value), cat?.name || '', store.name)
                              e.target.value = ''
                            }
                          }}
                          className="w-full px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">+ Agregar catálogo...</option>
                          {unassignedCatalogs.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
