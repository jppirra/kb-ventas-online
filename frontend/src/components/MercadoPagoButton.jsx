import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { paymentsApi } from '../api/payments'

const POLL_INTERVAL_MS = 3000
const POLL_MAX_MS = 10 * 60 * 1000 // 10 minutos

const MP_STATUS_LABELS = {
  approved: { label: 'Pago aprobado', color: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' },
  pending:  { label: 'Pago pendiente', color: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' },
  in_process: { label: 'Procesando...', color: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
  rejected: { label: 'Rechazado', color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30' },
  cancelled: { label: 'Cancelado', color: 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700' },
}

export default function MercadoPagoButton({ ticket, mpEnabled, onTicketUpdate }) {
  const [generating, setGenerating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const pollRef = useRef(null)
  const pollStartRef = useRef(null)

  // Iniciar polling cuando el ticket está en PAYMENT_PENDING
  useEffect(() => {
    if (ticket?.status === 'PAYMENT_PENDING' && ticket?.mpPreferenceId) {
      startPolling()
    }
    return () => stopPolling()
  }, [ticket?.id, ticket?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  function startPolling() {
    stopPolling()
    pollStartRef.current = Date.now()
    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_MAX_MS) {
        stopPolling()
        return
      }
      try {
        const { data } = await paymentsApi.getPaymentStatus(ticket.id)
        if (data.ticketStatus !== 'PAYMENT_PENDING') {
          stopPolling()
          onTicketUpdate?.(data.ticketStatus)
        }
      } catch {
        // silencioso — el servidor puede estar temporalmente no disponible
      }
    }, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function handleGenerateLink() {
    setGenerating(true)
    try {
      const { data } = await paymentsApi.createPreference(ticket.id)
      // Abrir Checkout Pro en nueva pestaña (sandbox o producción)
      const url = data.sandboxInitPoint || data.initPoint
      window.open(url, '_blank')
      onTicketUpdate?.('PAYMENT_PENDING', data)
      toast.success('Link de pago generado. Se abrió en una nueva pestaña.')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al generar el link de pago'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  async function handleReset() {
    if (!confirm('¿Generar un nuevo link de pago? El link anterior quedará inactivo.')) return
    setResetting(true)
    try {
      const { data } = await paymentsApi.resetPayment(ticket.id)
      onTicketUpdate?.(data.status, data)
      toast.success('Podés generar un nuevo link de pago')
    } catch {
      toast.error('Error al reiniciar el pago')
    } finally {
      setResetting(false)
    }
  }

  if (!mpEnabled) return null

  const status = ticket?.status
  const mpStatus = ticket?.mpStatus
  const mpBadge = mpStatus ? MP_STATUS_LABELS[mpStatus] : null

  // Ticket ya PAID mediante MP — solo informativo
  if (status === 'PAID' && mpStatus === 'approved') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Pagado con Mercado Pago
      </div>
    )
  }

  // Ticket DRAFT: mostrar botón para generar link
  if (status === 'DRAFT') {
    return (
      <button
        onClick={handleGenerateLink}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors"
      >
        {generating ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Generando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Generar link de pago
          </>
        )}
      </button>
    )
  }

  // Ticket PAYMENT_PENDING: mostrar link + polling
  if (status === 'PAYMENT_PENDING') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
            Esperando pago
          </span>
          {mpBadge && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mpBadge.color}`}>
              MP: {mpBadge.label}
            </span>
          )}
        </div>
        {ticket.mpPreferenceId && (
          <button
            onClick={() => {
              const url = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${ticket.mpPreferenceId}`
              window.open(url, '_blank')
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Abrir link de pago nuevamente
          </button>
        )}
      </div>
    )
  }

  // Ticket PAYMENT_FAILED: mostrar error + opción de reintentar
  if (status === 'PAYMENT_FAILED') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          Pago rechazado{ticket.mpStatusDetail ? ` — ${ticket.mpStatusDetail}` : ''}
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          {resetting ? 'Reiniciando...' : 'Generar nuevo link de pago'}
        </button>
      </div>
    )
  }

  return null
}
