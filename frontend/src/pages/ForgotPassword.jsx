import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../api/axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        {done ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Revisá tu correo</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Te enviamos el link para restablecer tu contraseña.</p>
            <Link to="/login" className="mt-6 inline-block text-indigo-600 hover:underline text-sm">Volver al login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recuperar contraseña</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Ingresá tu email y te enviamos el link de recuperación.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
            <Link to="/login" className="mt-4 block text-center text-sm text-gray-500 hover:underline">Volver al login</Link>
          </>
        )}
      </div>
    </div>
  )
}
