import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { paymentsApi } from '../api/payments'
import PhoneInput from './PhoneInput'
import api from '../api/axios'

export default function QrPaymentModal({ onClose }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preference, setPreference] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  // WhatsApp mini-form
  const [showWaForm, setShowWaForm] = useState(false)
  const [waName, setWaName] = useState('')
  const [waPhone, setWaPhone] = useState('')
  const [waCountry, setWaCountry] = useState('AR')
  const [savingCustomer, setSavingCustomer] = useState(false)

  useEffect(() => {
    if (!preference) return
    const url = preference.sandboxInitPoint || preference.initPoint
    if (!url) return
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }).then(setQrDataUrl)
    }).catch(() => setQrDataUrl(null))
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
      toast.error(err?.response?.data?.message || 'Error al generar el QR. Verificá que tu cuenta de MP esté conectada.')
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
    setShowWaForm(false)
    setWaName('')
    setWaPhone('')
    setWaCountry('AR')
  }

  function openWhatsApp(phone) {
    const url = preference?.sandboxInitPoint || preference?.initPoint
    const digits = phone.replace(/\D/g, '')
    const msg = encodeURIComponent(`Hola! Te comparto el link de pago: ${url}`)
    window.open(`https://wa.me/${digits}?text=${msg}`, '_blank')
  }

  async function handleWaSubmit(e) {
    e.preventDefault()
    if (!waPhone.trim()) { toast.error('Ingresá un número de teléfono'); return }
    setSavingCustomer(true)
    try {
      if (waName.trim()) {
        await api.post('/customers', {
          name: waName.trim(),
          phone: waPhone.trim(),
          phoneCountry: waCountry,
          source: 'manual',
        })
      }
      setShowWaForm(false)
      openWhatsApp(waPhone)
    } catch {
      // si falla el guardado igual enviamos el WA
      openWhatsApp(waPhone)
    } finally {
      setSavingCustomer(false)
    }
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
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Monto a cobrar *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 text-sm font-medium">$</span>
                  <input type="number" min="1" step="0.01" placeholder="0.00" value={amount}
                    onChange={e => setAmount(e.target.value)} autoFocus className={`${inputCls} pl-8`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Descripción (opcional)</label>
                <input type="text" placeholder="Venta presencial" value={description}
                  onChange={e => setDescription(e.target.value)} maxLength={80} className={inputCls} />
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
          ) : showWaForm ? (
            /* Mini-formulario para registrar cliente y enviar WhatsApp */
            <form onSubmit={handleWaSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Enviar link por WhatsApp</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">Ingresá el teléfono del cliente para enviarle el link de pago.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Nombre (opcional)</label>
                <input type="text" placeholder="Nombre del cliente" value={waName}
                  onChange={e => setWaName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Teléfono *</label>
                <PhoneInput
                  phone={waPhone}
                  onPhoneChange={setWaPhone}
                  country={waCountry}
                  onCountryChange={setWaCountry}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWaForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Volver
                </button>
                <button type="submit" disabled={savingCustomer}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {savingCustomer ? 'Enviando...' : 'Enviar WhatsApp'}
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
                {description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{description}</p>}
              </div>

              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR de pago" className="w-64 h-64 rounded-xl border border-gray-200 dark:border-slate-600" />
                ) : (
                  <div className="w-64 h-64 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs text-center px-4">
                    QR no disponible.<br />Usá el botón de abajo para abrir el link de pago.
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 dark:text-slate-500">
                Mostrá el QR al cliente para que pague con su celular.
              </p>

              {/* WhatsApp */}
              <button
                onClick={() => setShowWaForm(true)}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Enviar por WhatsApp
              </button>

              {/* Acciones secundarias */}
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

              <button onClick={handleReset} className="w-full py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Generar otro QR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
