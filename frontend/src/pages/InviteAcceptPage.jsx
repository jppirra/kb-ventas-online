import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { collaboratorsApi } from '../api/collaboratorsApi'
import { useAuth } from '../context/AuthContext'

export default function InviteAcceptPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [info, setInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!token) { setError('Token inválido'); setLoadingInfo(false); return }
    collaboratorsApi.inviteInfo(token)
      .then(r => setInfo(r.data))
      .catch(() => setError('Invitación no encontrada o inválida'))
      .finally(() => setLoadingInfo(false))
  }, [token])

  async function handleAccept() {
    if (!isAuthenticated) {
      localStorage.setItem('invite_token', token)
      navigate(`/login?redirect=/invite?token=${token}`)
      return
    }
    setAccepting(true)
    try {
      await collaboratorsApi.accept(token)
      setAccepted(true)
      toast.success('Invitación aceptada')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al aceptar invitación')
    } finally {
      setAccepting(false)
    }
  }

  if (authLoading || loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-gray-400 dark:text-slate-500 text-sm">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <p className="text-red-500 font-semibold text-lg mb-2">Invitación inválida</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">{error}</p>
          <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-900 dark:text-white font-bold text-xl mb-2">Invitación aceptada</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Ya podés acceder a los catálogos compartidos</p>
          <button onClick={() => navigate('/catalogs')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Ver catálogos
          </button>
        </div>
      </div>
    )
  }

  const ownerInitials = info?.collaboratorEmail ? info.collaboratorEmail.charAt(0).toUpperCase() : '?'

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 dark:bg-slate-950 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        {info?.collaboratorProfileImageUrl ? (
          <img src={info.collaboratorProfileImageUrl} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-indigo-300" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-500 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4 border-4 border-indigo-200">
            {ownerInitials}
          </div>
        )}
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {info?.collaboratorName || info?.collaboratorEmail}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-6">
          te invita a colaborar en sus catálogos
        </p>

        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-left mb-6 text-sm text-gray-600 dark:text-slate-300 space-y-1">
          <p><span className="font-medium">Acceso:</span> {info?.accessAllCatalogs ? 'Todos los catálogos' : (info?.catalogNames?.join(', ') || 'Catálogos específicos')}</p>
          <p><span className="font-medium">Publicar:</span> {info?.canPublish ? 'Sí' : 'No'}</p>
        </div>

        {info?.status === 'REVOKED' ? (
          <p className="text-sm text-red-500 font-medium">Esta invitación fue revocada</p>
        ) : info?.status === 'ACTIVE' ? (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Ya aceptaste esta invitación</p>
        ) : (
          <button onClick={handleAccept} disabled={accepting}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {accepting ? 'Aceptando...' : isAuthenticated ? 'Aceptar invitación' : 'Iniciar sesión y aceptar'}
          </button>
        )}
      </div>
    </div>
  )
}
