import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { paymentsApi } from '../api/payments'

export default function QrPaymentModal({ onClose }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preference, setPreference] = useState(null) // { preferenceId, initPoint, sandboxInitPoint }
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const canvasRef = useRef(null)

  // Generar QR cuando llega la preferencia
  useEffect(() => {
    if (!preference) return
    const url = preference.sandboxInitPoint || preference.initPoint
    if (!url) return

    import('qrcode').then(QRCode => {
      QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
      }).then(setQrDataUrl)
    }).catch(() => {
      // Fallback: si qrcode no está disponible, mostrar solo el link
      setQrDataUrl(null)
    })
  }, [preference])

  async function handleGenerate(e) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      toast.error('Ingresá un monto válido mayor a $0')
      return
    }
    setGenerating(true)
    try {
      const { data } = await paymentsApi.generateQrPreference(amt, description || 'Venta presencial')
      setPreference(data)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al generar el QR. Verificá que tu cuenta de MP esté conectada.'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  function handleCopyLink() {
    const url = preference?.sandboxInitPoint || preference?.initPoint
    if (!url) return
    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado'))
  }

  function handleOpenLink() {
    const url = preference?.sandboxInitPoint || preference?.initPoint
    if (url) window.open(url, '_blank')
  }

  function handleReset() {
    setPreference(null)
    setQrDataUrl(null)
    setAmount('')
    setDescription('')
  }

  const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cobrar con QR</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {!preference ? (
            /* Formulario de monto */
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Monto a cobrar *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    autoFocus
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Venta presencial"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={80}
                  className={inputCls}
                />
              </div>

              <p className="text-xs text-gray-400 dark:text-slate-500">
                El cliente escaneará el QR con su celular y pagará con Mercado Pago.
              </p>

              <div className="flex gap-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={generating || !amount}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                  {generating ? 'Generando...' : 'Generar QR'}
                </button>
              </div>
            </form>
          ) : (
            /* QR generado */
            <div className="space-y-4 text-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Monto</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${parseFloat(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                {description && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{description}</p>
                )}
              </div>

              {/* QR */}
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR de pago"
                    className="w-64 h-64 rounded-xl border border-gray-200 dark:border-slate-600"
                  />
                ) : (
                  <div className="w-64 h-64 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs text-center px-4">
                    QR no disponible.<br />Usá el botón de abajo para abrir el link de pago.
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 dark:text-slate-500">
                Mostrá el QR al cliente para que pague con su celular.
              </p>

              {/* Acciones */}
              <div className="flex gap-2">
                <button onClick={handleCopyLink}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar link
                </button>
                <button onClick={handleOpenLink}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Abrir link
                </button>
              </div>

              <button onClick={handleReset}
                className="w-full py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Generar otro QR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
