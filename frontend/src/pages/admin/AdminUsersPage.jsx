import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [editModal, setEditModal] = useState(null) // { id, name, email }
  const [editEmailValue, setEditEmailValue] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  const [tempPwdModal, setTempPwdModal] = useState(null) // { name, password }
  const [pwdCopied, setPwdCopied] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await adminApi.users()
      setUsers(data)
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleEnabled(id) {
    try {
      const { data } = await adminApi.toggleEnabled(id)
      setUsers(u => u.map(x => x.id === id ? { ...x, enabled: data.enabled } : x))
    } catch {
      toast.error('Error')
    }
  }

  async function handleToggleAdmin(id) {
    try {
      const { data } = await adminApi.toggleAdmin(id)
      setUsers(u => u.map(x => x.id === id ? { ...x, appAdmin: data.appAdmin } : x))
    } catch {
      toast.error('Error')
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await adminApi.deleteUser(id)
      setUsers(u => u.filter(x => x.id !== id))
      toast.success('Usuario eliminado')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    }
  }

  function openEditEmail(u) {
    setEditModal({ id: u.id, name: u.name })
    setEditEmailValue(u.email)
  }

  async function handleUpdateEmail(e) {
    e.preventDefault()
    setSavingEmail(true)
    try {
      const { data } = await adminApi.updateEmail(editModal.id, editEmailValue.trim())
      setUsers(u => u.map(x => x.id === editModal.id ? { ...x, email: data.email, emailVerified: data.emailVerified } : x))
      toast.success('Email actualizado')
      setEditModal(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar email')
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleResetPassword(id, name) {
    if (!confirm(`¿Blanquear la contraseña de "${name}"? Se generará una clave temporal.`)) return
    try {
      const { data } = await adminApi.resetPassword(id)
      setTempPwdModal({ name, password: data.tempPassword })
      setPwdCopied(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al blanquear contraseña')
    }
  }

  function copyTempPassword() {
    if (!tempPwdModal) return
    navigator.clipboard.writeText(tempPwdModal.password)
    setPwdCopied(true)
    setTimeout(() => setPwdCopied(false), 2000)
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
        <span className="text-sm text-gray-400 dark:text-slate-500">{users.length} en total</span>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre o email..."
        className="w-full max-w-sm px-3 py-2 mb-4 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Catálogos</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Admin</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{u.email}</p>
                      {!u.emailVerified && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">No verificado</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {u.slug
                      ? <a href={`/p/${u.slug}`} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs">/p/{u.slug}</a>
                      : <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell text-gray-600 dark:text-slate-400">
                    {u.catalogCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleEnabled(u.id)}
                      disabled={u.id === currentUser?.userId}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        u.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {u.enabled ? 'Activo' : 'Deshabilitado'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleAdmin(u.id)}
                      disabled={u.id === currentUser?.userId}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        u.appAdmin
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 hover:bg-violet-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {u.appAdmin ? 'Admin' : 'Usuario'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Editar email */}
                      <button
                        onClick={() => openEditEmail(u)}
                        title="Editar email"
                        className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {/* Blanquear contraseña */}
                      <button
                        onClick={() => handleResetPassword(u.id, u.name)}
                        title="Blanquear contraseña"
                        className="p-1.5 text-gray-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      {/* Eliminar */}
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={u.appAdmin || u.id === currentUser?.userId}
                        title="Eliminar usuario"
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* Modal editar email */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Editar email</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">{editModal.name}</p>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nuevo email</label>
                <input
                  type="email"
                  required
                  value={editEmailValue}
                  onChange={e => setEditEmailValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">El email quedará como no verificado.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingEmail}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                  {savingEmail ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditModal(null)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal mostrar contraseña temporal */}
      {tempPwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTempPwdModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h3 className="font-semibold text-gray-900 dark:text-white">Contraseña temporal</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">{tempPwdModal.name}</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-3">
              <span className="flex-1 font-mono text-base font-semibold text-gray-900 dark:text-white tracking-widest select-all">
                {tempPwdModal.password}
            </span>
              <button onClick={copyTempPassword}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">
                {pwdCopied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              Compartí esta clave con el usuario. Pedile que la cambie desde su perfil.
            </p>
            <button onClick={() => setTempPwdModal(null)}
              className="w-full py-2 bg-gray-900 dark:bg-slate-700 hover:bg-gray-700 dark:hover:bg-slate-600 text-white font-semibold rounded-xl text-sm transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
