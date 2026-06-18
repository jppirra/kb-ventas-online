import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import { collaboratorsApi } from '../api/collaboratorsApi'
import { catalogsApi } from '../api/catalogs'

const STATUS_LABEL = { PENDING: 'Pendiente', ACTIVE: 'Activo', REVOKED: 'Revocado' }
const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

function Avatar({ name, url }) {
  if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
  const initials = name ? name.charAt(0).toUpperCase() : '?'
  return (
    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
      {initials}
    </div>
  )
}

export default function CollaboratorsPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [catalogs, setCatalogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [inviteForm, setInviteForm] = useState({
    email: '', accessAllCatalogs: true, catalogIds: [], canPublish: false,
  })
  const [editForm, setEditForm] = useState({
    accessAllCatalogs: true, catalogIds: [], canPublish: false,
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cr, cats] = await Promise.all([
        collaboratorsApi.list(),
        catalogsApi.list(),
      ])
      setCollaborators(cr.data)
      setCatalogs((cats.data || []).filter(c => !c.collaboratorCanPublish !== undefined || c.ownerUserId))
    } catch {
      toast.error('Error al cargar colaboradores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleInvite(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await collaboratorsApi.invite({
        email: inviteForm.email,
        accessAllCatalogs: inviteForm.accessAllCatalogs,
        catalogIds: inviteForm.accessAllCatalogs ? [] : inviteForm.catalogIds,
        canPublish: inviteForm.canPublish,
      })
      toast.success('Invitación enviada')
      setShowInviteModal(false)
      setInviteForm({ email: '', accessAllCatalogs: true, catalogIds: [], canPublish: false })
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al enviar invitación')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id) {
    setSaving(true)
    try {
      await collaboratorsApi.update(id, {
        accessAllCatalogs: editForm.accessAllCatalogs,
        catalogIds: editForm.accessAllCatalogs ? [] : editForm.catalogIds,
        canPublish: editForm.canPublish,
      })
      toast.success('Permisos actualizados')
      setEditingId(null)
      load()
    } catch {
      toast.error('Error al actualizar permisos')
    } finally {
      setSaving(false)
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm('¿Revocar acceso a este colaborador?')) return
    try {
      await collaboratorsApi.revoke(id)
      toast.success('Acceso revocado')
      load()
    } catch {
      toast.error('Error al revocar acceso')
    }
  }

  function openEdit(c) {
    setEditForm({
      accessAllCatalogs: c.accessAllCatalogs,
      catalogIds: c.catalogIds || [],
      canPublish: c.canPublish,
    })
    setEditingId(c.id)
  }

  const ownCatalogs = catalogs.filter(c => !c.collaboratorCanPublish && c.ownerUserId)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <main className={`flex-1 overflow-y-auto pt-14 transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="max-w-3xl mx-auto px-4 py-8">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Colaboradores</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Invitá personas para editar tus catálogos</p>
            </div>
            <button onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              + Invitar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-slate-500">
              <p className="text-lg font-medium">Todavía no tenés colaboradores</p>
              <p className="text-sm mt-1">Invitá a alguien para que te ayude a gestionar tus catálogos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collaborators.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
                  {editingId === c.id ? (
                    <EditForm
                      form={editForm} setForm={setEditForm}
                      catalogs={ownCatalogs} saving={saving}
                      onSave={() => handleUpdate(c.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-start gap-3">
                      <Avatar name={c.collaboratorName || c.collaboratorEmail} url={c.collaboratorProfileImageUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {c.collaboratorName || c.collaboratorEmail}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status] || ''}`}>
                            {STATUS_LABEL[c.status] || c.status}
                          </span>
                        </div>
                        {c.collaboratorName && (
                          <p className="text-xs text-gray-400 dark:text-slate-500">{c.collaboratorEmail}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400">
                          <span>{c.accessAllCatalogs ? 'Todos los catálogos' : (c.catalogNames?.join(', ') || 'Sin catálogos')}</span>
                          <span className={c.canPublish ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                            {c.canPublish ? 'Puede publicar' : 'Solo editar'}
                          </span>
                        </div>
                      </div>
                      {c.status !== 'REVOKED' && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEdit(c)}
                            className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => handleRevoke(c.id)}
                            className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            Revocar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Invitar colaborador</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Email</label>
                <input type="email" required value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colaborador@email.com" />
              </div>
              <CatalogAccessSection
                form={inviteForm} setForm={setInviteForm}
                catalogs={ownCatalogs}
              />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="inv-can-publish" checked={inviteForm.canPublish}
                  onChange={e => setInviteForm(f => ({ ...f, canPublish: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <label htmlFor="inv-can-publish" className="text-sm text-gray-700 dark:text-slate-300">Puede publicar catálogos</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogAccessSection({ form, setForm, catalogs }) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Acceso a catálogos</label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="access" checked={form.accessAllCatalogs}
              onChange={() => setForm(f => ({ ...f, accessAllCatalogs: true, catalogIds: [] }))} />
            <span className="text-sm text-gray-700 dark:text-slate-300">Todos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="access" checked={!form.accessAllCatalogs}
              onChange={() => setForm(f => ({ ...f, accessAllCatalogs: false }))} />
            <span className="text-sm text-gray-700 dark:text-slate-300">Elegir catálogos</span>
          </label>
        </div>
      </div>
      {!form.accessAllCatalogs && (
        <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-xl p-2">
          {catalogs.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">No hay catálogos propios</p>
          ) : catalogs.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer py-1">
              <input type="checkbox" checked={form.catalogIds.includes(cat.id)}
                onChange={e => setForm(f => ({
                  ...f,
                  catalogIds: e.target.checked
                    ? [...f.catalogIds, cat.id]
                    : f.catalogIds.filter(id => id !== cat.id),
                }))} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{cat.name}</span>
            </label>
          ))}
        </div>
      )}
    </>
  )
}

function EditForm({ form, setForm, catalogs, saving, onSave, onCancel }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Editar permisos</p>
      <CatalogAccessSection form={form} setForm={setForm} catalogs={catalogs} />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="edit-can-publish" checked={form.canPublish}
          onChange={e => setForm(f => ({ ...f, canPublish: e.target.checked }))}
          className="w-4 h-4 rounded" />
        <label htmlFor="edit-can-publish" className="text-sm text-gray-700 dark:text-slate-300">Puede publicar catálogos</label>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
