import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { settingsApi } from '../api/settings'
import { useAuth } from '../context/AuthContext'

function Section({ title, description, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setPwLoading(true)
    try {
      await settingsApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Contraseña actualizada correctamente')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al cambiar la contraseña'
      toast.error(msg)
    } finally {
      setPwLoading(false)
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    if (deleteConfirm !== 'ELIMINAR') {
      toast.error('Escribí ELIMINAR para confirmar')
      return
    }
    setDeleteLoading(true)
    try {
      await settingsApi.deleteAccount()
      toast.success('Cuenta eliminada')
      logout()
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al eliminar la cuenta'
      toast.error(msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>

        {/* Cambiar contraseña */}
        <Section
          title="Cambiar contraseña"
          description="Actualizá tu contraseña de acceso."
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repetí la nueva contraseña"
                required
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {pwLoading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </Section>

        {/* Zona peligrosa */}
        <Section
          title="Zona peligrosa"
          description="Estas acciones son permanentes e irreversibles."
        >
          <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Eliminar cuenta</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Se eliminarán permanentemente tu cuenta, catálogos, productos y todos tus datos. Esta acción no se puede deshacer.
              </p>
            </div>
            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">
                  Escribí <span className="font-mono font-bold text-red-600">ELIMINAR</span> para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="ELIMINAR"
                  className="w-full px-3 py-2 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={deleteLoading || deleteConfirm !== 'ELIMINAR'}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar mi cuenta'}
              </button>
            </form>
          </div>
        </Section>
      </div>
    </Layout>
  )
}
