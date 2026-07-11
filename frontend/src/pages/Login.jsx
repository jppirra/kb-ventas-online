import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { COUNTRIES } from '../utils/countries'

function CountryModal({ onSave }) {
  const [country, setCountry] = useState('AR')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/profile', { countryCode: country })
      onSave(country)
    } catch {
      toast.error('No se pudo guardar el país. Podés cambiarlo después en Configuración.')
      onSave(country)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-5">
        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">¿En qué país estás?</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Esto nos ayuda a configurar la facturación y los medios de pago correctamente.</p>
        </div>
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {saving ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const VERSION = __APP_VERSION__
const YEAR = new Date().getFullYear()

export default function Login() {
  const { login, storeUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showCountryModal, setShowCountryModal] = useState(false)

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
    setGoogleLoading(true)
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential })
      storeUser(res.data)
      if (res.data.newUser) {
        setShowCountryModal(true)
      } else {
        navigate('/')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión con Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    toast.error('No se pudo conectar con Google. Verificá la configuración.')
  }

  return (
    <>
    {showCountryModal && (
      <CountryModal onSave={(code) => {
        localStorage.setItem('countryCode', code)
        setShowCountryModal(false)
        navigate('/')
      }} />
    )}
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <a href="/mercato/" className="flex flex-col items-center gap-2 mb-6">
          <img src="/logo-icon.png" alt="" className="h-24 w-24 rounded-2xl object-cover shadow-lg" />
          <span className="font-bold text-gray-900 dark:text-white text-3xl tracking-tight">Mercato</span>
        </a>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required onInvalid={e => e.target.setCustomValidity('Ingresá un email válido')} onInput={e => e.target.setCustomValidity('')}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required onInvalid={e => e.target.setCustomValidity('Ingresá tu contraseña')} onInput={e => e.target.setCustomValidity('')}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
            {googleLoading ? (
              <div className="flex items-center gap-2 py-2 px-4 text-sm text-gray-500 dark:text-slate-400">
                <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Conectando con Google...
              </div>
            ) : (
              <GoogleLogin onSuccess={handleGoogle} onError={handleGoogleError} />
            )}
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
    </>
  )
}
