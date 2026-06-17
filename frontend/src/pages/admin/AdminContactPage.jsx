import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { contactApi } from '../../api/contact'
import { toast } from 'sonner'
import { fmtDate, fmtDateTime } from '../../utils/date'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const s = String(dateStr)
  const d = new Date(s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z')
  const diff = (Date.now() - d) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    contactApi.all()
      .then(r => setMessages(r.data))
      .catch(() => toast.error('Error al cargar mensajes'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(msg) {
    setSelected(msg)
    if (!msg.read) {
      try {
        await contactApi.markRead(msg.id)
        setMessages(ms => ms.map(m => m.id === msg.id ? { ...m, read: true } : m))
      } catch {}
    }
  }

  const unread = messages.filter(m => !m.read).length

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Contacto</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded-full">
              {unread} sin leer
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : (
          <div className="flex gap-4 h-[calc(100vh-12rem)]">
            {/* List */}
            <div className="w-80 shrink-0 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-400 dark:text-slate-500 text-center">Sin mensajes</p>
              ) : messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${selected?.id === msg.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!msg.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{msg.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{msg.subject}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{timeAgo(msg.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 overflow-y-auto">
              {selected ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selected.subject}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                      <span className="font-medium text-gray-700 dark:text-slate-300">{selected.name}</span>
                      {' — '}<a href={`mailto:${selected.email}`} className="text-blue-500 hover:underline">{selected.email}</a>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{fmtDateTime(selected.createdAt)}</p>
                  </div>
                  <hr className="border-gray-100 dark:border-slate-700" />
                  <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                  <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                    className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                    Responder por email
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-slate-500">
                  Selecciona un mensaje para ver el detalle
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
