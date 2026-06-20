import React, { useState } from 'react'
import { toast } from 'sonner'
import { paymentsApi } from '../api/payments'

export default function MercadoPagoConnect({ status, onStatusChange }) {
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const { data } = await paymentsApi.getMpAuthUrl()
      window.location.href = data.authUrl
    } catch {
      toast.error('No se pudo obtener el link de autorización. Intentá nuevamente.')
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar tu cuenta de Mercado Pago? Los links de pago existentes dejarán de funcionar.')) return
    setDisconnecting(true)
    try {
      await paymentsApi.disconnectMp()
      toast.success('Cuenta de Mercado Pago desconectada')
      onStatusChange({ mpEnabled: false })
    } catch {
      toast.error('Error al desconectar. Intentá nuevamente.')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Mercado Pago</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Cobrá con link de pago directo</p>
        </div>
        {status?.mpEnabled && (
          <span className="ml-auto text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
            Conectado
          </span>
        )}
      </div>

      {status?.mpEnabled ? (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
            {status.mpUserId && (
              <p>ID de cuenta: <span className="font-mono font-medium text-gray-700 dark:text-slate-300">{status.mpUserId}</span></p>
            )}
            {status.mpConnectedAt && (
              <p>Conectado el {new Date(status.mpConnectedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 disabled:opacity-50 transition-colors"
          >
            {disconnecting ? 'Desconectando...' : 'Desconectar cuenta'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Conectá tu cuenta de Mercado Pago para generar links de pago en tus comprobantes.
            El dinero se acredita directamente en tu cuenta.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors"
          >
            {loading ? 'Redirigiendo...' : 'Conectar con Mercado Pago'}
          </button>
        </div>
      )}
    </div>
  )
}
