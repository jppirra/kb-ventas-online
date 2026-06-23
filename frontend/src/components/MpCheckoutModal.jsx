import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { paymentsApi } from '../api/payments'

const POLL_INTERVAL_MS = 3000
const POLL_MAX_MS = 10 * 60 * 1000

export default function MpCheckoutModal({ ticket, onClose }) {
  const navigate = useNavigate()
  const [state, setState] = useState('loading') // loading | ready | paid | error
  const [checkoutUrl, setCheckoutUrl] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [mpPaymentId, setMpPaymentId] = useState(null)
  const [paidTicket, setPaidTicket] = useState(null)
  const pollRef = useRef(null)
  const pollStartRef = useRef(null)

  useEffect(() => {
    paymentsApi.createPreference(ticket.id)
      .then(({ data }) => {
        const url = data.initPoint || data.sandboxInitPoint
        setCheckoutUrl(url)
        import('qrcode').then(QRCode =>
          QRCode.toDataURL(url, { width: 220, margin: 2, color: { dark: '#1e3a5f', light: '#ffffff' } })
            .then(setQrDataUrl).catch(() => {})
        ).catch(() => {})
        setState('ready')
        startPolling()
      })
      .catch(err => {
        toast.error(err?.response?.data?.message || 'Error al generar el link de pago')
        setState('error')
      })
    return () => stopPolling()
  }, []) // eslint-disable-line

  function startPolling() {
    stopPolling()
    pollStartRef.current = Date.now()
    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_MAX_MS) { stopPolling(); return }
      try {
        const { data } = await paymentsApi.getPaymentStatus(ticket.id)
        if (data.ticketStatus === 'PAID') {
          stopPolling()
          setMpPaymentId(data.mpPaymentId)
          setPaidTicket({ ...ticket, status: 'PAID', mpPaymentId: data.mpPaymentId, mpStatus: data.mpStatus })
          setState('paid')
          toast.success('¡Pago recibido!')
        }
      } catch { /* silencioso */ }
    }, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  function handleClose() {
    stopPolling()
    onClose(paidTicket)
  }

  function handleViewTicket() {
    stopPolling()
    navigate(`/tickets/${ticket.id}`)
    onClose(paidTicket)
  }

  async function handleRetry() {
    setState('loading')
    setQrDataUrl(null)
    setCheckoutUrl(null)
    try {
      const { data } = await paymentsApi.createPreference(ticket.id)
      const url = data.initPoint || data.sandboxInitPoint
      setCheckoutUrl(url)
      import('qrcode').then(QRCode =>
        QRCode.toDataURL(url, { width: 220, margin: 2, color: { dark: '#1e3a5f', light: '#ffffff' } })
          .then(setQrDataUrl).catch(() => {})
      ).catch(() => {})
      setState('ready')
      startPolling()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al generar el link de pago')
      setState('error')
    }
  }

  const cur = '$'
  const total = Number(ticket.total).toLocaleString('es-AR')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {state === 'paid' ? 'Pago recibido' : 'Cobrar con Mercado Pago'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {ticket.ticketNumber} — {cur}{total}
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {state === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-sm text-gray-500 dark:text-slate-400">Generando link de pago...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400">No se pudo generar el link de pago.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleRetry} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-colors">
                  Reintentar
                </button>
                <button onClick={handleViewTicket} className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Ver comprobante
                </button>
              </div>
            </div>
          )}

          {state === 'ready' && (
            <div className="flex flex-col items-center gap-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR de pago" className="w-48 h-48 rounded-xl border border-gray-200 dark:border-slate-600" />
              ) : (
                <div className="w-48 h-48 rounded-xl border border-gray-200 dark:border-slate-600 flex items-center justify-center bg-gray-50 dark:bg-slate-700">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              )}
              <span className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
                Esperando pago...
              </span>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => navigator.clipboard.writeText(checkoutUrl).then(() => toast.success('Link copiado'))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Copiar link
                </button>
                <button
                  onClick={() => window.open(checkoutUrl, '_blank')}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm text-white rounded-xl transition-colors"
                >
                  Abrir link
                </button>
              </div>
            </div>
          )}

          {state === 'paid' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">¡Pago aprobado!</p>
                {mpPaymentId && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-mono">ID MP: {mpPaymentId}</p>
                )}
              </div>
              <button
                onClick={handleViewTicket}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Ver comprobante e imprimir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
