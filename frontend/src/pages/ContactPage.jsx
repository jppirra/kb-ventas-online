import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { contactApi } from '../api/contact'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import Layout from '../components/Layout'

function BrandBar({ isAuthenticated }) {
  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <a href="/mercato/" title="Conocer más sobre Mercato" className="flex items-center gap-2 shrink-0">
          <img src="/logo-icon.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
          <img src="/logo-text.png" alt="Mercato" className="h-5 object-contain mix-blend-multiply dark:hidden" />
          <span className="hidden dark:block font-bold text-white text-base tracking-tight">Mercato</span>
        </a>
        {!isAuthenticated && (
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:block text-gray-500 dark:text-slate-400">¿Querés hacer crecer tu negocio?</span>
            <Link to="/login" className="px-3 py-1.5 text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
              Ingresar
            </Link>
            <Link to="/register" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Registrarse
            </Link>
          </div>
        )}
        {isAuthenticated && (
          <Link to="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Ir al panel
          </Link>
        )}
      </div>
    </header>
  )
}

function PageFooter() {
  return (
    <footer className="py-6 border-t border-gray-100 dark:border-slate-800 text-center">
      <a href="/mercato/" title="Conocer más sobre Mercato" className="inline-flex items-center gap-2 mb-2">
        <img src="/logo-icon.png" alt="" className="h-6 w-6 rounded-md object-cover opacity-70" />
        <img src="/logo-text.png" alt="Mercato" className="h-4 object-contain mix-blend-multiply dark:hidden opacity-60" />
        <span className="hidden dark:block text-sm font-semibold text-slate-500">Mercato</span>
      </a>
      <p className="text-xs text-gray-400 dark:text-slate-600">
        © {new Date().getFullYear()} Mercato — Todos los derechos reservados
      </p>
    </footer>
  )
}

export default function ContactPage() {
  const { isAuthenticated } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await contactApi.submit(form)
      setSent(true)
      toast.success('Mensaje enviado')
    } catch {
      toast.error('Error al enviar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'

  const formContent = (
    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacto</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Completá el formulario y te respondemos a la brevedad.</p>
          </div>

          {sent ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-4xl">✉️</p>
              <p className="text-gray-700 dark:text-slate-300 font-medium">Mensaje enviado</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Nos pondremos en contacto pronto.</p>
              <Link to={isAuthenticated ? '/dashboard' : '/'} className="inline-block mt-2 text-sm text-blue-500 hover:underline">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre</label>
                  <input name="name" value={form.name} onChange={handleChange} required maxLength={100} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required maxLength={150} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Asunto</label>
                <input name="subject" value={form.subject} onChange={handleChange} required maxLength={200} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Mensaje</label>
                <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                  className={`${inputClass} resize-none`} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </form>
          )}
    </div>
  )

  if (isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-6 py-10">
          {formContent}
        </div>
      </Layout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <BrandBar isAuthenticated={isAuthenticated} />
      <main className="flex-1 flex items-center justify-center p-4 py-10">
        {formContent}
      </main>
      <PageFooter />
    </div>
  )
}
