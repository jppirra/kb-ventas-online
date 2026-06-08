import React, { useCallback, useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'

const EMAIL_TYPE_LABELS = {
  VERIFICATION: 'Verificación',
  RESET: 'Recuperar contraseña',
  ORDER: 'Pedido',
  CATALOG_PAUSED: 'Catálogo pausado',
  ADMIN: 'Admin',
  TEST: 'Prueba',
}

const SETTING_LABELS = {
  'email.from_name':              { label: 'Nombre del remitente', type: 'text', group: 'General' },
  'email.primary_color':          { label: 'Color principal (hex)', type: 'color', group: 'General' },
  'email.verification.subject':   { label: 'Verificación — Asunto', type: 'text', group: 'Verificación de email' },
  'email.verification.cta_text':  { label: 'Verificación — Texto del botón', type: 'text', group: 'Verificación de email' },
  'email.verification.footer':    { label: 'Verificación — Pie', type: 'text', group: 'Verificación de email' },
  'email.reset.subject':          { label: 'Contraseña — Asunto', type: 'text', group: 'Recuperar contraseña' },
  'email.reset.cta_text':         { label: 'Contraseña — Texto del botón', type: 'text', group: 'Recuperar contraseña' },
  'email.reset.footer':           { label: 'Contraseña — Pie', type: 'text', group: 'Recuperar contraseña' },
}

// ── Tab: Logs + test ─────────────────────────────────────────────────────────

function LogsTab() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const pageSize = 30

  const load = useCallback(() => {
    setLoading(true)
    adminApi.emailLogs(page, pageSize)
      .then(r => { setLogs(r.data.content); setTotal(r.data.totalElements) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  async function handleTest() {
    if (!testEmail) return
    setTestSending(true)
    setTestResult(null)
    try {
      const r = await adminApi.sendTestEmail(testEmail)
      setTestResult({ ok: true, msg: r.data.message })
      setTimeout(() => load(), 1500)
    } catch (e) {
      setTestResult({ ok: false, msg: e.response?.data?.message || 'Error al enviar.' })
    } finally {
      setTestSending(false)
    }
  }

  const filtered = logs.filter(l =>
    (!filterType || l.type === filterType) &&
    (!filterStatus || l.status === filterStatus)
  )
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-5">
      {/* Test email */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Enviar email de prueba</p>
        <div className="flex gap-2">
          <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
            placeholder="correo@ejemplo.com" onKeyDown={e => e.key === 'Enter' && handleTest()}
            className="flex-1 text-sm border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0" />
          <button onClick={handleTest} disabled={testSending || !testEmail}
            className="text-sm px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors whitespace-nowrap">
            {testSending ? 'Enviando...' : 'Enviar prueba'}
          </button>
        </div>
        {testResult && (
          <p className={`text-xs mt-2 ${testResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {testResult.ok ? '✅' : '❌'} {testResult.msg}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">El resultado aparece en los logs de abajo.</p>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Logs de email <span className="text-gray-400 font-normal">({total} total)</span>
          </p>
          <button onClick={load} className="text-sm px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 transition-colors">
            ↻ Actualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 dark:border-slate-600 rounded-xl px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 focus:outline-none">
            <option value="">Todos los tipos</option>
            {Object.entries(EMAIL_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 dark:border-slate-600 rounded-xl px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 focus:outline-none">
            <option value="">Todos los estados</option>
            <option value="SUCCESS">✅ Success</option>
            <option value="FAILED">❌ Failed</option>
          </select>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin registros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-700">
                  <th className="pb-2 pr-3 font-medium">Fecha</th>
                  <th className="pb-2 pr-3 font-medium">Para</th>
                  <th className="pb-2 pr-3 font-medium">Tipo</th>
                  <th className="pb-2 pr-3 font-medium">Asunto</th>
                  <th className="pb-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {filtered.map(log => (
                  <React.Fragment key={log.id}>
                    <tr
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${log.status === 'FAILED' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="py-2 pr-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-slate-300 truncate max-w-[140px] text-xs">{log.toEmail}</td>
                      <td className="py-2 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {EMAIL_TYPE_LABELS[log.type] || log.type}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-600 dark:text-slate-400 truncate max-w-[180px] text-xs">{log.subject}</td>
                      <td className="py-2">
                        {log.status === 'SUCCESS'
                          ? <span className="text-xs font-medium text-green-600 dark:text-green-400">✅ OK</span>
                          : <span className="text-xs font-medium text-red-600 dark:text-red-400">❌ Error</span>}
                      </td>
                    </tr>
                    {expandedId === log.id && log.errorMessage && (
                      <tr className="bg-red-50 dark:bg-red-900/20">
                        <td colSpan={5} className="px-3 py-2">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Error:</p>
                          <code className="text-xs text-red-800 dark:text-red-300 break-all">{log.errorMessage}</code>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="text-sm px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              ← Anterior
            </button>
            <span className="text-xs text-gray-500 dark:text-slate-400">Página {page + 1} de {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              className="text-sm px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Preview ─────────────────────────────────────────────────────────────

function PreviewTab() {
  const [cfg, setCfg] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.emailSettings()
      .then(r => {
        const map = {}
        r.data.forEach(s => { map[s.key] = s.value })
        setCfg(map)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 py-8 text-center">Cargando...</div>

  const color = cfg['email.primary_color'] || '#6366f1'
  const fromName = cfg['email.from_name'] || 'Mercato'
  const ctaText = cfg['email.verification.cta_text'] || 'Activar mi cuenta →'
  const footer = cfg['email.verification.footer'] || 'Este link expira en 24 horas.'
  const subject = cfg['email.verification.subject'] || 'Activá tu cuenta en Mercato'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
      <div className="text-xs text-gray-500 dark:text-slate-400 mb-4 space-y-1">
        <p><span className="font-medium">De:</span> {fromName} &lt;noreply@mercato.com&gt;</p>
        <p><span className="font-medium">Asunto:</span> {subject}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-slate-600 overflow-hidden bg-[#f5f3ff]">
        <div className="p-8">
          <div className="text-center mb-5">
            <span style={{ color, fontSize: 22, fontWeight: 700 }}>{fromName}</span>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm max-w-[480px] mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activá tu cuenta</h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Hola <strong className="text-gray-800">Juan</strong>, gracias por registrarte. Hacé clic para activar tu cuenta.
            </p>
            <div className="mb-6">
              <button style={{ background: color }} className="px-8 py-3.5 rounded-xl text-white font-semibold text-sm">
                {ctaText}
              </button>
            </div>
            <p className="text-xs text-gray-400">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Configuración ────────────────────────────────────────────────────────

function ConfigTab() {
  const [settings, setSettings] = useState([])
  const [edits, setEdits] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    adminApi.emailSettings().then(r => {
      setSettings(r.data)
      const init = {}
      r.data.forEach(s => { init[s.key] = s.value })
      setEdits(init)
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await adminApi.saveEmailSettings(edits)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">Cargando...</div>

  const groups = {}
  settings.forEach(s => {
    const meta = SETTING_LABELS[s.key]
    if (!meta) return
    if (!groups[meta.group]) groups[meta.group] = []
    groups[meta.group].push(s)
  })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-6">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">{group}</p>
          <div className="space-y-3">
            {items.map(s => {
              const meta = SETTING_LABELS[s.key]
              const val = edits[s.key] ?? s.value
              return (
                <div key={s.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {meta.label}
                    <span className="ml-2 font-normal text-xs text-gray-400 font-mono">{s.key}</span>
                  </label>
                  {meta.type === 'color' ? (
                    <div className="flex items-center gap-3">
                      <input type="color" value={val || '#6366f1'}
                        onChange={e => setEdits(p => ({ ...p, [s.key]: e.target.value }))}
                        className="h-10 w-14 rounded-xl border border-gray-300 dark:border-slate-600 cursor-pointer p-0.5" />
                      <input type="text" value={val}
                        onChange={e => setEdits(p => ({ ...p, [s.key]: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ) : (
                    <input type="text" value={val}
                      onChange={e => setEdits(p => ({ ...p, [s.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span className="text-green-600 dark:text-green-400 text-sm font-medium">✅ Guardado</span>}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'logs', label: 'Logs' },
  { id: 'preview', label: 'Preview' },
  { id: 'config', label: 'Configuración' },
]

export default function AdminEmailPage() {
  const [tab, setTab] = useState('logs')

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emails</h1>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'logs' && <LogsTab />}
      {tab === 'preview' && <PreviewTab />}
      {tab === 'config' && <ConfigTab />}
    </AdminLayout>
  )
}
