import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../api/axios'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Revisá tu correo</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">Te enviamos un link para activar tu cuenta.</p>
        <Link to="/login" className="mt-6 inline-block text-indigo-600 hover:underline text-sm">Volver al login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Nombre', key: 'name', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Contraseña', key: 'password', type: 'password' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                required className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          ¿Ya tenés cuenta? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
