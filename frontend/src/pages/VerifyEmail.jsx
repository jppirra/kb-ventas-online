import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { storeUser } = useAuth()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    api.get(`/auth/verify-email?token=${token}`)
      .then(res => { storeUser(res.data); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-300">Verificando tu cuenta...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Cuenta verificada!</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Tu cuenta está activa. Ya podés usar la app.</p>
            <Link to="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Comenzar
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Token inválido o expirado</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">El link ya fue usado o expiró.</p>
            <Link to="/login" className="text-indigo-600 hover:underline text-sm">Volver al login</Link>
          </>
        )}
      </div>
    </div>
  )
}
