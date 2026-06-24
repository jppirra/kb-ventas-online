import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import { toast } from 'sonner'
import PhoneInput from '../components/PhoneInput'
import { flagEmoji } from '../utils/countries'

const emptyForm = { name: '', dni: '', phone: '', phoneCountry: 'AR', email: '', notes: '' }

function CustomerForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || emptyForm)

  useEffect(() => { setForm(initial || emptyForm) }, [initial])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-3 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Nombre *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">DNI / CUIT</label>
          <input value={form.dni} onChange={e => set('dni', e.target.value)}
            placeholder="20-12345678-9"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Teléfono</label>
          <PhoneInput
            phone={form.phone}
            onPhoneChange={v => set('phone', v)}
            country={form.phoneCountry}
            onCountryChange={v => set('phoneCountry', v)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Notas</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await api.get('/customers')
      setCustomers(data)
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form) {
    setSaving(true)
    try {
      if (editingCustomer) {
        const { data } = await api.put(`/customers/${editingCustomer.id}`, form)
        setCustomers(cs => cs.map(c => c.id === editingCustomer.id ? data : c))
        toast.success('Cliente actualizado')
      } else {
        const { data } = await api.post('/customers', form)
        setCustomers(cs => [data, ...cs])
        toast.success('Cliente guardado')
      }
      setShowForm(false)
      setEditingCustomer(null)
    } catch {
      toast.error('Error al guardar cliente')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar este cliente?')) return
    try {
      await api.delete(`/customers/${id}`)
      setCustomers(cs => cs.filter(c => c.id !== id))
      toast.success('Cliente eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  function openCreate() {
    setEditingCustomer(null)
    setShowForm(true)
  }

  function openEdit(c) {
    setEditingCustomer(c)
    setShowForm(true)
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name?.toLowerCase().includes(q) || c.dni?.includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
  })

  const sourceLabel = { manual: 'Manual', order: 'Pedido', message: 'Mensaje' }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{customers.length} contactos guardados</p>
          </div>
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
            + Nuevo cliente
          </button>
        </div>

        {(showForm && !editingCustomer) && (
          <CustomerForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
        )}

        {customers.length > 5 && (
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
        )}

        {loading ? (
          <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 text-sm">
              {search ? 'Sin resultados para esa busqueda.' : 'Aun no tenes clientes guardados.'}
            </p>
            {!search && (
              <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">
                Podes agregar clientes manualmente o guardarlos desde un pedido.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id}>
                {editingCustomer?.id === c.id ? (
                  <CustomerForm
                    initial={{ name: c.name, dni: c.dni || '', phone: c.phone || '', phoneCountry: c.phoneCountry || 'AR', email: c.email || '', notes: c.notes || '' }}
                    onSave={handleSave}
                    onCancel={() => { setEditingCustomer(null); setShowForm(false) }}
                    saving={saving}
                  />
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {c.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                        {c.dni && (
                          <span className="text-xs font-mono text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{c.dni}</span>
                        )}
                        {c.source && c.source !== 'manual' && (
                          <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            {sourceLabel[c.source] || c.source}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {c.phone && (
                          <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                            className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                            <span>{flagEmoji(c.phoneCountry || 'AR')}</span>
                            <span>{c.phone}</span>
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate">
                            {c.email}
                          </a>
                        )}
                        {c.notes && (
                          <span className="text-xs text-gray-400 dark:text-slate-500 truncate">{c.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {c.phone && (
                        <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </a>
                      )}
                      <button onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
