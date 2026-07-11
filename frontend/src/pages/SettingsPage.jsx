import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { settingsApi } from '../api/settings'
import { ratingsApi } from '../api/ratings'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { COUNTRIES } from '../utils/countries'

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
  const { logout, user } = useAuth()

  const [countryCode, setCountryCode] = useState(user?.countryCode || 'AR')
  const [countrySaving, setCountrySaving] = useState(false)

  async function handleSaveCountry(e) {
    e.preventDefault()
    setCountrySaving(true)
    try {
      await api.put('/profile', { countryCode })
      toast.success('País guardado')
    } catch {
      toast.error('Error al guardar el país')
    } finally {
      setCountrySaving(false)
    }
  }

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [reportFreq, setReportFreq] = useState('NONE')
  const [reportDow, setReportDow] = useState(1)
  const [reportDom, setReportDom] = useState(1)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    settingsApi.getStockReportConfig()
      .then(r => {
        setReportFreq(r.data.frequency || 'NONE')
        setReportDow(r.data.dayOfWeek || 1)
        setReportDom(r.data.dayOfMonth || 1)
      })
      .catch(() => {})
  }, [])

  async function handleSaveReport(e) {
    e.preventDefault()
    setReportLoading(true)
    try {
      await settingsApi.saveStockReportConfig({ frequency: reportFreq, dayOfWeek: reportDow, dayOfMonth: reportDom })
      toast.success('Configuración guardada')
    } catch { toast.error('Error al guardar') }
    finally { setReportLoading(false) }
  }

  const [npsScore, setNpsScore] = useState(0)
  const [npsHover, setNpsHover] = useState(0)
  const [npsComment, setNpsComment] = useState('')
  const [npsLoading, setNpsLoading] = useState(false)
  const [npsLoaded, setNpsLoaded] = useState(false)
  const [npsSaved, setNpsSaved] = useState(false)

  useEffect(() => {
    ratingsApi.mine()
      .then(r => {
        if (r.status === 200 && r.data) {
          setNpsScore(r.data.score)
          setNpsComment(r.data.comment || '')
          setNpsSaved(true)
        }
      })
      .catch(() => {})
      .finally(() => setNpsLoaded(true))
  }, [])

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

  async function handleNpsSubmit(e) {
    e.preventDefault()
    if (!npsScore) { toast.error('Seleccioná una valoración'); return }
    setNpsLoading(true)
    try {
      await ratingsApi.submit({ score: npsScore, comment: npsComment })
      toast.success('Valoración enviada. ¡Gracias!')
      setNpsSaved(true)
    } catch {
      toast.error('Error al enviar la valoración')
    } finally {
      setNpsLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>

        {/* País de residencia */}
        <Section
          title="País de residencia"
          description="Se usa para configurar facturación y medios de pago disponibles."
        >
          <form onSubmit={handleSaveCountry} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">País</label>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className={inputClass}
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={countrySaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
            >
              {countrySaving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Section>

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

        {/* Valoración NPS */}
        <Section
          title="Tu opinión"
          description="Contanos cómo te está yendo con Mercato. Tu feedback nos ayuda a mejorar."
        >
          {!npsLoaded ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : (
            <form onSubmit={handleNpsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-slate-400 mb-2">
                  ¿Cómo calificás tu experiencia con Mercato?
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => { setNpsScore(star); setNpsSaved(false) }}
                      onMouseEnter={() => setNpsHover(star)}
                      onMouseLeave={() => setNpsHover(0)}
                      className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={star <= (npsHover || npsScore) ? 'text-yellow-400' : 'text-gray-200 dark:text-slate-600'}>
                        ★
                      </span>
                    </button>
                  ))}
                  {npsScore > 0 && (
                    <span className="ml-2 self-center text-sm text-gray-500 dark:text-slate-400">
                      {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][npsScore]}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Comentario <span className="text-gray-400 dark:text-slate-500">(opcional)</span>
                </label>
                <textarea
                  value={npsComment}
                  onChange={e => { setNpsComment(e.target.value); setNpsSaved(false) }}
                  rows={3}
                  maxLength={500}
                  placeholder="Contanos qué te gustó o qué podemos mejorar..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={npsLoading || !npsScore}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {npsLoading ? 'Enviando...' : npsSaved ? 'Actualizar calificación' : 'Calificar'}
                </button>
                {npsSaved && (
                  <span className="text-sm text-green-600 dark:text-green-400">Valoración enviada</span>
                )}
              </div>
            </form>
          )}
        </Section>

        {/* Informe de stock */}
        <Section title="Informe de stock" description="Recibí un resumen de tu stock por email de forma automática.">
          <form onSubmit={handleSaveReport} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Frecuencia</label>
              <div className="flex flex-wrap gap-2">
                {[['NONE','Sin envío'],['DAILY','Diario'],['WEEKLY','Semanal'],['MONTHLY','Mensual']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setReportFreq(val)}
                    className={`px-4 py-1.5 rounded-xl border text-sm font-medium transition-colors ${reportFreq === val ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {reportFreq === 'WEEKLY' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Día de la semana</label>
                <select value={reportDow} onChange={e => setReportDow(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[['Lunes',1],['Martes',2],['Miércoles',3],['Jueves',4],['Viernes',5],['Sábado',6],['Domingo',7]].map(([d,v]) => (
                    <option key={v} value={v}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            {reportFreq === 'MONTHLY' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Día del mes</label>
                <select value={reportDom} onChange={e => setReportDom(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Array.from({length: 28}, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" disabled={reportLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
              {reportLoading ? 'Guardando...' : 'Guardar'}
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
