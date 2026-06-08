import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const VERSION = 'v1.000.06'
const YEAR = new Date().getFullYear()

export default function Login() {
  const { login, storeUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential })
      storeUser(res.data)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión con Google.')
    }
  }

  const handleGoogleError = () => {
    toast.error('No se pudo conectar con Google. Verificá la configuración.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">¿Olvidaste tu contraseña?</Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          <span className="text-xs text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
        </div>

        {GOOGLE_CLIENT_ID ? (
          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogle} onError={handleGoogleError} />
          </div>
        ) : (
          <p className="text-center text-xs text-gray-400 dark:text-slate-500">
            Google Sign-In no configurado.
          </p>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">Registrate</Link>
        </p>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-600">
          Desarrollado por{' '}
          <a href="https://jafpsoft.com" target="_blank" rel="noopener noreferrer"
            className="hover:text-gray-500 dark:hover:text-slate-400 transition-colors">
            JAFPSoft
          </a>
          {' '}© {YEAR} · Todos los derechos reservados · {VERSION}
        </p>
      </div>
    </div>
  )
}
