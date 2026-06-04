import React, { useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'

export default function AdminEmailPage() {
  const [form, setForm] = useState({ to: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    setSending(true)
    try {
      await adminApi.sendEmail(form)
      toast.success(`Email enviado a ${form.to}`)
      setForm({ to: '', subject: '', body: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar email')
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Emails</h1>

      <div className="max-w-xl">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Enviar email manual</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Destinatario</label>
              <input
                type="email"
                value={form.to}
                onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                required
                placeholder="destinatario@ejemplo.com"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Asunto</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                required
                placeholder="Asunto del email"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Mensaje</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                required
                rows={6}
                placeholder="Contenido del mensaje..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {sending ? 'Enviando...' : 'Enviar email'}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Nota</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            Los emails se envían usando Resend. Asegurate de tener configurado <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">RESEND_API_KEY</code> y un dominio verificado en producción.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
