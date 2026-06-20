import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'
import { toast } from 'sonner'

function toSlug(str) {
  return str.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export default function AdminRubrosPage() {
  const [rubros, setRubros] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const [editOrder, setEditOrder] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newOrder, setNewOrder] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data } = await adminApi.listRubros()
      setRubros(data)
    } catch {
      toast.error('Error al cargar rubros')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(r) {
    setEditingId(r.id)
    setEditLabel(r.label)
    setEditOrder(r.sortOrder ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditLabel('')
    setEditOrder('')
  }

  async function saveEdit(id) {
    if (!editLabel.trim()) return
    setSaving(true)
    try {
      const { data } = await adminApi.updateRubro(id, {
        label: editLabel.trim(),
        sortOrder: editOrder !== '' ? parseInt(editOrder) : 0,
      })
      setRubros(rs => rs.map(r => r.id === id ? data : r))
      setEditingId(null)
      toast.success('Rubro actualizado')
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(r) {
    try {
      const { data } = await adminApi.updateRubro(r.id, { active: !r.active })
      setRubros(rs => rs.map(x => x.id === r.id ? data : x))
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este rubro? Los catálogos que lo usen quedarán sin rubro asignado.')) return
    try {
      await adminApi.deleteRubro(id)
      setRubros(rs => rs.filter(r => r.id !== id))
      toast.success('Rubro eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    const value = newValue.trim() || toSlug(newLabel)
    if (!value) { toast.error('Valor inválido'); return }
    setSaving(true)
    try {
      const { data } = await adminApi.createRubro({
        label: newLabel.trim(),
        value,
        sortOrder: newOrder !== '' ? parseInt(newOrder) : 99,
      })
      setRubros(rs => [...rs, data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label)))
      setNewLabel('')
      setNewValue('')
      setNewOrder('')
      toast.success('Rubro creado')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al crear rubro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Rubros</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Categorías principales para clasificar catálogos en el explorador público.</p>

        {loading ? (
          <div className="text-gray-400 dark:text-slate-500 text-sm">Cargando...</div>
        ) : (
          <div className="space-y-2 mb-8">
            {rubros.map(r => (
              <div key={r.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3">
                {editingId === r.id ? (
                  <>
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(r.id); if (e.key === 'Escape') cancelEdit() }}
                      className="flex-1 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={editOrder}
                      onChange={e => setEditOrder(e.target.value)}
                      placeholder="Orden"
                      className="w-20 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => saveEdit(r.id)} disabled={saving} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold disabled:opacity-50">Guardar</button>
                    <button onClick={cancelEdit} className="px-3 py-1 text-xs border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className={`w-6 text-xs text-center font-mono text-gray-400 dark:text-slate-500 shrink-0`}>{r.sortOrder ?? 0}</span>
                    <span className={`flex-1 text-sm font-medium ${r.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500 line-through'}`}>{r.label}</span>
                    <span className="text-xs font-mono text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{r.value}</span>
                    <button
                      onClick={() => toggleActive(r)}
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${r.active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200'}`}
                    >
                      {r.active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button onClick={() => startEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nuevo rubro */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Agregar rubro</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-slate-400">Nombre *</label>
              <input
                value={newLabel}
                onChange={e => { setNewLabel(e.target.value); if (!newValue) setNewValue(toSlug(e.target.value)) }}
                placeholder="Ej: Tecnología"
                required
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-slate-400">Valor (slug)</label>
              <input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="tecnologia"
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-slate-400">Orden</label>
              <input
                type="number"
                value={newOrder}
                onChange={e => setNewOrder(e.target.value)}
                placeholder="99"
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
              />
            </div>
            <button type="submit" disabled={saving || !newLabel.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
              Agregar
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">El slug se genera automáticamente desde el nombre. Orden menor = aparece primero.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
