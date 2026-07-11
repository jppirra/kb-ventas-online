import React, { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ticketsApi } from '../api/tickets'

export default function PaymentConfirmModal({ ticket, config, onClose }) {
  const method = ticket.paymentMethod || ''
  const isTransfer = method === 'Transferencia'
  const isCard = method === 'Tarjetas' || method === 'Tarjeta'
  const isCash = method === 'Efectivo'

  const bankAccounts = (() => {
    try { return JSON.parse(config?.bankAccounts || '[]') } catch { return [] }
  })()

  const [reference, setReference] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(bankAccounts[0]?.alias || '')
  const [manualAccount, setManualAccount] = useState('')
  const [proofUrl, setProofUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  async function handleProofUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await ticketsApi.uploadPaymentProof(ticket.id, file)
      setProofUrl(data.proofUrl)
      toast.success('Comprobante subido')
    } catch { toast.error('Error al subir imagen') }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      const ref = [
        isTransfer && (selectedAccount || manualAccount) ? `Cuenta: ${selectedAccount || manualAccount}` : null,
        reference ? `Ref: ${reference}` : null,
      ].filter(Boolean).join(' | ') || null

      const { data } = await ticketsApi.confirmLocalPayment(ticket.id, { reference: ref, proofUrl })
      toast.success('Pago confirmado')
      onClose(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al confirmar pago')
    } finally { setSaving(false) }
  }

  const cur = config?.currency || '$'
  const total = Number(ticket.total).toLocaleString('es-AR')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isCash ? 'Confirmar cobro en efectivo' : `Confirmar pago — ${method}`}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {ticket.ticketNumber} — {cur}{total}
            </p>
          </div>
          <button onClick={() => onClose(null)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isCash && (
            <p className="text-sm text-gray-600 dark:text-slate-300 text-center py-2">
              Confirmás que recibiste el pago en efectivo de <strong>{cur}{total}</strong>.
            </p>
          )}

          {isTransfer && (
            <>
              {bankAccounts.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Cuenta destino
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={e => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {bankAccounts.map((acc, i) => (
                      <option key={i} value={acc.alias}>
                        {acc.alias}{acc.bank ? ` — ${acc.bank}` : ''}{acc.cbu ? ` (${acc.cbu})` : ''}
                      </option>
                    ))}
                    <option value="">Otra cuenta (completar abajo)</option>
                  </select>
                  {selectedAccount === '' && (
                    <input
                      type="text"
                      value={manualAccount}
                      onChange={e => setManualAccount(e.target.value)}
                      placeholder="Alias o CBU de la cuenta"
                      className="mt-2 w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}
              {bankAccounts.length === 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Cuenta destino (opcional)
                  </label>
                  <input
                    type="text"
                    value={manualAccount}
                    onChange={e => setManualAccount(e.target.value)}
                    placeholder="Alias o CBU"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  N.º de transacción (opcional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Código o número de transferencia"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Comprobante de transferencia (opcional)
                </label>
                {proofUrl ? (
                  <div className="flex items-center gap-2">
                    <img src={proofUrl} alt="Comprobante" className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-slate-600" />
                    <button type="button" onClick={() => setProofUrl(null)} className="text-xs text-red-500 hover:text-red-700">Quitar</button>
                  </div>
                ) : (
                  <button type="button" disabled={uploading} onClick={() => fileRef.current.click()}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-slate-600 text-sm text-gray-500 dark:text-slate-400 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                    {uploading ? 'Subiendo...' : '+ Subir comprobante (imagen)'}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
              </div>
            </>
          )}

          {isCard && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                N.º de cupón (opcional)
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Número de cupón de tarjeta"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Si no tenés el cupón, podés aceptar igual.</p>
            </div>
          )}

          {!isCash && !isTransfer && !isCard && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Código de confirmación (opcional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Código de operación"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Comprobante (imagen, opcional)
                </label>
                {proofUrl ? (
                  <div className="flex items-center gap-2">
                    <img src={proofUrl} alt="Comprobante" className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-slate-600" />
                    <button type="button" onClick={() => setProofUrl(null)} className="text-xs text-red-500 hover:text-red-700">Quitar</button>
                  </div>
                ) : (
                  <button type="button" disabled={uploading} onClick={() => fileRef.current.click()}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-slate-600 text-sm text-gray-500 dark:text-slate-400 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                    {uploading ? 'Subiendo...' : '+ Subir imagen'}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProofUpload} />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => onClose(null)}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button onClick={handleConfirm} disabled={saving || uploading}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
              {saving ? 'Confirmando...' : 'Aceptar — Cobrado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
