import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'
import { useAuth } from '../../context/AuthContext'
import { fmtDate, fmtDateTime } from '../../utils/date'

const ACTION_LABEL = { BLOCKED: 'Bloqueado', UNBLOCKED: 'Desbloqueado' }
const ACTION_COLOR = {
  BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  UNBLOCKED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function UserModerationLogPanel({ userId, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.userModerationLog(userId)
      .then(r => setLogs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Historial de moderación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 space-y-3">
          {loading && <p className="text-sm text-gray-400 dark:text-slate-500">Cargando...</p>}
          {!loading && logs.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-slate-500">Sin acciones registradas.</p>
          )}
          {logs.map(log => (
            <div key={log.id} className="border border-gray-100 dark:border-slate-700 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLOR[log.action] || ''}`}>
                  {ACTION_LABEL[log.action] || log.action}
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(log.createdAt)}</span>
              </div>
              {log.reason && <p className="text-sm text-gray-700 dark:text-slate-300">"{log.reason}"</p>}
              <p className="text-xs text-gray-400 dark:text-slate-500">por {log.adminName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ modal, onClose }) {
  const [reason, setReason] = useState('')
  if (!modal) return null
  const { title, description, confirmLabel, danger, withReason, onConfirm } = modal

  function handleConfirm() {
    onConfirm(withReason ? reason.trim() : undefined)
  }

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
            onClick={handleConfirm}
            disabled={withReason && !reason.trim()}
            className={`flex-1 py-2 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-40 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkActionBar({ count, onBlock, onUnblock, onVerify, onResetPwd, onDelete, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl mb-3">
      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
        {count} seleccionado{count !== 1 ? 's' : ''}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1">
        <button onClick={onBlock}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors">
          Bloquear
        </button>
        <button onClick={onUnblock}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors">
          Desbloquear
        </button>
        <button onClick={onVerify}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50 transition-colors">
          Reenviar verificación
        </button>
        <button onClick={onResetPwd}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors">
          Blanquear contraseñas
        </button>
        <button onClick={onDelete}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors">
          Eliminar
        </button>
      </div>
      <button onClick={onClear}
        className="text-xs text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 shrink-0 px-1">
        Limpiar
      </button>
    </div>
  )
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())

  const [confirmModal, setConfirmModal] = useState(null)
  const [logUserId, setLogUserId] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [editEmailValue, setEditEmailValue] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [tempPwdModal, setTempPwdModal] = useState(null)
  const [pwdCopied, setPwdCopied] = useState(false)
  const [profileModal, setProfileModal] = useState(null)
  const [profileForm, setProfileForm] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)

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

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const filteredIds = filtered.map(u => u.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id))
  const someSelected = filteredIds.some(id => selectedIds.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(prev => { const next = new Set(prev); filteredIds.forEach(id => next.delete(id)); return next })
    } else {
      setSelectedIds(prev => { const next = new Set(prev); filteredIds.forEach(id => next.add(id)); return next })
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selCount = [...selectedIds].filter(id => filteredIds.includes(id)).length
  const selIds = [...selectedIds].filter(id => filteredIds.includes(id))

  // ── Single-user actions ───────────────────────────────────────────────────

  function confirmToggleEnabled(u) {
    const blocking = u.enabled
    setConfirmModal({
      title: blocking ? `Bloquear a ${u.name}` : `Desbloquear a ${u.name}`,
      description: blocking
        ? 'El usuario no podrá iniciar sesión ni acceder a la plataforma hasta que lo reactives.'
        : 'El usuario podrá volver a iniciar sesión y usar la plataforma.',
      confirmLabel: blocking ? 'Bloquear cuenta' : 'Desbloquear cuenta',
      danger: blocking,
      withReason: true,
      onConfirm: async (reason) => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.toggleEnabled(u.id, reason)
          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, enabled: data.enabled } : x))
          toast.success(data.enabled ? 'Cuenta desbloqueada' : 'Cuenta bloqueada')
        } catch { toast.error('Error') }
      },
    })
  }

  function confirmToggleAdmin(u) {
    const removing = u.appAdmin
    setConfirmModal({
      title: removing ? `Quitar admin a ${u.name}` : `Dar acceso admin a ${u.name}`,
      description: removing
        ? 'El usuario perderá acceso al panel de administración y todas sus funciones.'
        : 'El usuario tendrá acceso completo al panel de administración. Solo hacé esto con personas de confianza.',
      confirmLabel: removing ? 'Quitar admin' : 'Dar admin',
      danger: !removing,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.toggleAdmin(u.id)
          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, appAdmin: data.appAdmin } : x))
          toast.success(data.appAdmin ? 'Admin asignado' : 'Admin removido')
        } catch { toast.error('Error') }
      },
    })
  }

  function confirmDelete(u) {
    setConfirmModal({
      title: `Eliminar a ${u.name}`,
      description: 'Se eliminarán permanentemente su cuenta, catálogos y todos sus datos. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar usuario',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await adminApi.deleteUser(u.id)
          setUsers(prev => prev.filter(x => x.id !== u.id))
          toast.success('Usuario eliminado')
        } catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar') }
      },
    })
  }

  function confirmResetPassword(u) {
    setConfirmModal({
      title: `Blanquear contraseña de ${u.name}`,
      description: 'Se generará una contraseña temporal. El usuario deberá cambiarla al ingresar.',
      confirmLabel: 'Blanquear contraseña',
      danger: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.resetPassword(u.id)
          setTempPwdModal({ name: u.name, password: data.tempPassword })
          setPwdCopied(false)
        } catch (err) { toast.error(err.response?.data?.message || 'Error al blanquear contraseña') }
      },
    })
  }

  function confirmResendVerification(u) {
    setConfirmModal({
      title: `Reenviar verificación a ${u.name}`,
      description: `Se enviará un nuevo email de verificación a ${u.email}. El link tendrá validez de 24 horas.`,
      confirmLabel: 'Reenviar email',
      danger: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await adminApi.resendVerification(u.id)
          toast.success('Email de verificación enviado')
        } catch (err) { toast.error(err.response?.data?.message || 'Error al enviar email') }
      },
    })
  }

  function confirmVerifyEmailDirectly(u) {
    setConfirmModal({
      title: `Verificar email de ${u.name}`,
      description: 'Se marcará el email como verificado sin enviar ningún correo. La cuenta quedará activa inmediatamente.',
      confirmLabel: 'Verificar ahora',
      danger: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.verifyEmail(u.id)
          setUsers(prev => prev.map(x => x.id === u.id ? { ...x, emailVerified: data.emailVerified, enabled: data.enabled } : x))
          toast.success('Email verificado')
        } catch (err) { toast.error(err.response?.data?.message || 'Error al verificar email') }
      },
    })
  }

  function openEditEmail(u) {
    setEditModal({ id: u.id, name: u.name })
    setEditEmailValue(u.email)
  }

  function openEditProfile(u) {
    setProfileModal({ id: u.id, name: u.name })
    setProfileForm({
      name: u.name || '',
      slug: u.slug || '',
      bio: u.bio || '',
      whatsappNumber: u.whatsappNumber || '',
      brandColorPrimary: u.brandColorPrimary || '#2563eb',
      brandColorSecondary: u.brandColorSecondary || '#7c3aed',
    })
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await adminApi.updateProfile(profileModal.id, profileForm)
      setUsers(prev => prev.map(x => x.id === profileModal.id ? { ...x, ...data } : x))
      toast.success('Perfil actualizado')
      setProfileModal(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar perfil')
    } finally { setSavingProfile(false) }
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
    } finally { setSavingEmail(false) }
  }

  function copyTempPassword() {
    if (!tempPwdModal) return
    navigator.clipboard.writeText(tempPwdModal.password)
    setPwdCopied(true)
    setTimeout(() => setPwdCopied(false), 2000)
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  function confirmBulkBlock() {
    setConfirmModal({
      title: `Bloquear ${selCount} usuario${selCount !== 1 ? 's' : ''}`,
      description: 'Los usuarios seleccionados no podrán iniciar sesión. Se omitirán admins y cuentas ya bloqueadas.',
      confirmLabel: 'Bloquear seleccionados',
      danger: true,
      withReason: true,
      onConfirm: async (reason) => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkBlock(selIds, reason)
          toast.success(`${data.processed} bloqueado${data.processed !== 1 ? 's' : ''}${data.skipped > 0 ? `, ${data.skipped} omitido${data.skipped !== 1 ? 's' : ''}` : ''}`)
          setSelectedIds(new Set())
          await load()
        } catch { toast.error('Error al bloquear usuarios') }
      },
    })
  }

  function confirmBulkUnblock() {
    setConfirmModal({
      title: `Desbloquear ${selCount} usuario${selCount !== 1 ? 's' : ''}`,
      description: 'Los usuarios seleccionados podrán volver a iniciar sesión. Se omitirán los que ya estén activos.',
      confirmLabel: 'Desbloquear seleccionados',
      danger: false,
      withReason: true,
      onConfirm: async (reason) => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkUnblock(selIds, reason)
          toast.success(`${data.processed} desbloqueado${data.processed !== 1 ? 's' : ''}${data.skipped > 0 ? `, ${data.skipped} omitido${data.skipped !== 1 ? 's' : ''}` : ''}`)
          setSelectedIds(new Set())
          await load()
        } catch { toast.error('Error al desbloquear usuarios') }
      },
    })
  }

  function confirmBulkVerify() {
    setConfirmModal({
      title: `Reenviar verificación a ${selCount} usuario${selCount !== 1 ? 's' : ''}`,
      description: 'Se enviará un email de verificación a los usuarios seleccionados que aún no verificaron su cuenta. Los ya verificados serán omitidos.',
      confirmLabel: 'Enviar emails',
      danger: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkResendVerification(selIds)
          toast.success(`${data.processed} email${data.processed !== 1 ? 's' : ''} enviado${data.processed !== 1 ? 's' : ''}${data.skipped > 0 ? `, ${data.skipped} omitido${data.skipped !== 1 ? 's' : ''}` : ''}`)
          setSelectedIds(new Set())
        } catch { toast.error('Error al enviar verificaciones') }
      },
    })
  }

  function confirmBulkResetPwd() {
    setConfirmModal({
      title: `Blanquear contraseñas de ${selCount} usuario${selCount !== 1 ? 's' : ''}`,
      description: 'Se generará una nueva contraseña temporal para cada usuario y se enviará por email. Esta acción no se puede deshacer.',
      confirmLabel: 'Blanquear y enviar por email',
      danger: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkResetPassword(selIds)
          toast.success(`${data.processed} contraseña${data.processed !== 1 ? 's' : ''} enviada${data.processed !== 1 ? 's' : ''} por email`)
          setSelectedIds(new Set())
        } catch { toast.error('Error al blanquear contraseñas') }
      },
    })
  }

  function confirmBulkDelete() {
    setConfirmModal({
      title: `Eliminar ${selCount} usuario${selCount !== 1 ? 's' : ''}`,
      description: 'Se eliminarán permanentemente las cuentas, catálogos y todos los datos. Se omitirán admins y tu propia cuenta. Esta acción NO se puede deshacer.',
      confirmLabel: 'Eliminar seleccionados',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          const { data } = await adminApi.bulkDelete(selIds)
          toast.success(`${data.processed} usuario${data.processed !== 1 ? 's' : ''} eliminado${data.processed !== 1 ? 's' : ''}${data.skipped > 0 ? `, ${data.skipped} omitido${data.skipped !== 1 ? 's' : ''}` : ''}`)
          setSelectedIds(new Set())
          await load()
        } catch { toast.error('Error al eliminar usuarios') }
      },
    })
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
        <span className="text-sm text-gray-400 dark:text-slate-500">{users.length} en total</span>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setSelectedIds(new Set()) }}
        placeholder="Buscar por nombre o email..."
        className="w-full max-w-sm px-3 py-2 mb-4 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {selCount > 0 && (
        <BulkActionBar
          count={selCount}
          onBlock={confirmBulkBlock}
          onUnblock={confirmBulkUnblock}
          onVerify={confirmBulkVerify}
          onResetPwd={confirmBulkResetPwd}
          onDelete={confirmBulkDelete}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Catálogos</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Vistas perfil</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Último acceso</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Admin</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map(u => {
                const isSelected = selectedIds.has(u.id)
                return (
                  <tr key={u.id} className={`transition-colors cursor-default ${isSelected ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(u.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
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
                    <td className="px-4 py-3 text-center hidden lg:table-cell text-gray-600 dark:text-slate-400">
                      {u.profileViewCount ?? 0}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {u.lastAccessAt
                        ? <span className="text-xs text-gray-500 dark:text-slate-400">{fmtDateTime(u.lastAccessAt)}</span>
                        : <span className="text-xs text-gray-300 dark:text-slate-600">Nunca</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => confirmToggleEnabled(u)}
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
                        onClick={() => confirmToggleAdmin(u)}
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
                        {!u.emailVerified && (
                          <button onClick={() => confirmResendVerification(u)} title="Reenviar email de verificación"
                            className="p-1.5 text-gray-400 hover:text-teal-500 dark:text-slate-500 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        {!u.emailVerified && (
                          <button onClick={() => confirmVerifyEmailDirectly(u)} title="Verificar email directamente"
                            className="p-1.5 text-gray-400 hover:text-green-500 dark:text-slate-500 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button onClick={() => openEditEmail(u)} title="Editar email"
                          className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => openEditProfile(u)} title="Editar perfil"
                          className="p-1.5 text-gray-400 hover:text-purple-500 dark:text-slate-500 dark:hover:text-purple-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                        <button onClick={() => confirmResetPassword(u)} title="Blanquear contraseña"
                          className="p-1.5 text-gray-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button onClick={() => setLogUserId(u.id)} title="Historial de moderación"
                          className="p-1.5 text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button onClick={() => confirmDelete(u)}
                          disabled={u.appAdmin || u.id === currentUser?.userId}
                          title="Eliminar usuario"
                          className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
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
          </div>
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
                <input type="email" required value={editEmailValue} onChange={e => setEditEmailValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus />
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
              <button onClick={copyTempPassword} className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">
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

      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />

      {logUserId && (
        <UserModerationLogPanel userId={logUserId} onClose={() => setLogUserId(null)} />
      )}

      {/* Modal editar perfil */}
      {profileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProfileModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Editar perfil</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">{profileModal.name}</p>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre</label>
                <input type="text" required value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Slug (URL del perfil público)</label>
                <div className="flex items-center rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                  <span className="px-3 py-2 text-xs text-gray-400 dark:text-slate-500 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 shrink-0">/p/</span>
                  <input type="text" value={profileForm.slug}
                    onChange={e => setProfileForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="mi-tienda"
                    className="flex-1 px-3 py-2 bg-transparent text-gray-900 dark:text-white focus:outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Bio</label>
                <textarea value={profileForm.bio}
                  onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3} placeholder="Descripción del negocio..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">WhatsApp</label>
                <input type="text" value={profileForm.whatsappNumber}
                  onChange={e => setProfileForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Color primario</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                    <input type="color" value={profileForm.brandColorPrimary}
                      onChange={e => setProfileForm(f => ({ ...f, brandColorPrimary: e.target.value }))}
                      className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer p-0" />
                    <span className="text-xs font-mono text-gray-600 dark:text-slate-400">{profileForm.brandColorPrimary}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Color secundario</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                    <input type="color" value={profileForm.brandColorSecondary}
                      onChange={e => setProfileForm(f => ({ ...f, brandColorSecondary: e.target.value }))}
                      className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer p-0" />
                    <span className="text-xs font-mono text-gray-600 dark:text-slate-400">{profileForm.brandColorSecondary}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingProfile}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                  {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={() => setProfileModal(null)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
