import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { ticketsApi } from '../api/tickets'

const CONDICIONES_IVA = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'No Responsable',
  'Consumidor Final',
]

const TIPOS_COMPROBANTE = [
  { value: 'SIN', label: 'SIN — Ticket genérico (no válido como factura)' },
  { value: 'A', label: 'A — Responsable Inscripto a Responsable Inscripto' },
  { value: 'B', label: 'B — Responsable Inscripto a Consumidor Final / Monotrib.' },
  { value: 'C', label: 'C — Monotributista a cualquier destinatario' },
]

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function TicketConfigPage() {
  const navigate = useNavigate()
  const logoRef = useRef()
  const [form, setForm] = useState({
    businessName: '', businessAddress: '', businessPhone: '',
    businessEmail: '', taxId: '', logoUrl: '', currency: '$',
    paymentMethods: 'Efectivo, Transferencia', footer: '', showCatalogQr: false,
    tipoComprobante: 'B', puntoVenta: '', condicionIva: '', ingresosBrutos: '', inicioActividades: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    ticketsApi.getConfig()
      .then(r => setForm(f => ({ ...f, ...r.data, puntoVenta: r.data.puntoVenta ?? '' })))
      .finally(() => setLoading(false))
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await ticketsApi.saveConfig({ ...form, puntoVenta: form.puntoVenta !== '' ? Number(form.puntoVenta) : null })
      toast.success('Configuración guardada')
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const { data } = await ticketsApi.uploadLogo(file)
      set('logoUrl', data.logoUrl)
      toast.success('Logo subido')
    } catch { toast.error('Error al subir logo') }
    finally { setUploadingLogo(false); e.target.value = '' }
  }

  const afipEnabled = form.puntoVenta !== '' && form.puntoVenta !== null

  if (loading) return <Layout><div className="text-center py-16 text-gray-400">Cargando...</div></Layout>

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => navigate('/tickets')}
            className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tickets
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurar comprobante</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Esta información aparece en cada comprobante de venta.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Datos del negocio */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Datos del negocio</h2>

            {/* Logo */}
            <Field label="Logo">
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-contain border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700" />
                ) : (
                  <div className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-300 dark:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <button type="button" disabled={uploadingLogo} onClick={() => logoRef.current.click()}
                    className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm rounded-xl transition-colors disabled:opacity-50">
                    {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                  </button>
                  {form.logoUrl && (
                    <button type="button" onClick={() => set('logoUrl', '')} className="ml-2 text-sm text-red-400 hover:text-red-600">Quitar</button>
                  )}
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PNG o JPG, máx. 2MB</p>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Nombre del negocio *">
                  <input type="text" value={form.businessName} onChange={e => set('businessName', e.target.value)} required
                    placeholder="Mi tienda de ropa" className={inputCls} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Dirección">
                  <input type="text" value={form.businessAddress} onChange={e => set('businessAddress', e.target.value)}
                    placeholder="Av. Corrientes 1234, Buenos Aires" className={inputCls} />
                </Field>
              </div>
              <Field label="Teléfono">
                <input type="text" value={form.businessPhone} onChange={e => set('businessPhone', e.target.value)}
                  placeholder="+54 11 1234-5678" className={inputCls} />
              </Field>
              <Field label="Email del negocio">
                <input type="email" value={form.businessEmail} onChange={e => set('businessEmail', e.target.value)}
                  placeholder="ventas@mitienda.com" className={inputCls} />
              </Field>
              <Field label="CUIT">
                <input type="text" value={form.taxId} onChange={e => set('taxId', e.target.value)}
                  placeholder="20-12345678-9" className={inputCls} />
              </Field>
              <Field label="Moneda">
                <input type="text" value={form.currency} onChange={e => set('currency', e.target.value)}
                  placeholder="$" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Formas de pago" hint="Separadas por coma — aparecen como opciones al crear un ticket">
                  <input type="text" value={form.paymentMethods} onChange={e => set('paymentMethods', e.target.value)}
                    placeholder="Efectivo, Transferencia, Tarjeta" className={inputCls} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Pie del comprobante">
                  <textarea rows={2} value={form.footer} onChange={e => set('footer', e.target.value)}
                    placeholder="¡Gracias por tu compra! Conservá este comprobante."
                    className={`${inputCls} resize-none`} />
                </Field>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="showQr" checked={form.showCatalogQr}
                onChange={e => set('showCatalogQr', e.target.checked)} className="rounded" />
              <label htmlFor="showQr" className="text-sm text-gray-700 dark:text-slate-300">Mostrar QR del catálogo en el comprobante</label>
            </div>
          </div>

          {/* Factura electrónica Argentina */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Factura electrónica Argentina (AFIP)</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Completá estos datos para que el comprobante siga el formato requerido por AFIP.
                La integración directa con el web service de AFIP para emitir CAE está en desarrollo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Condición frente al IVA">
                  <select value={form.condicionIva} onChange={e => set('condicionIva', e.target.value)} className={inputCls}>
                    <option value="">— Seleccioná —</option>
                    {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Punto de venta AFIP" hint="Dejá vacío para usar numeración simple (T-0001)">
                <input type="number" min="1" max="9999" value={form.puntoVenta}
                  onChange={e => set('puntoVenta', e.target.value)}
                  placeholder="1" className={inputCls} />
              </Field>

              <Field label="Tipo de comprobante">
                <select value={form.tipoComprobante} onChange={e => set('tipoComprobante', e.target.value)}
                  disabled={!afipEnabled} className={`${inputCls} disabled:opacity-50`}>
                  {TIPOS_COMPROBANTE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>

              <Field label="Ingresos Brutos">
                <input type="text" value={form.ingresosBrutos} onChange={e => set('ingresosBrutos', e.target.value)}
                  placeholder="N° o CM" className={inputCls} />
              </Field>

              <Field label="Inicio de actividades">
                <input type="text" value={form.inicioActividades} onChange={e => set('inicioActividades', e.target.value)}
                  placeholder="01/01/2020" className={inputCls} />
              </Field>
            </div>

            {afipEnabled && (
              <div className="text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-amber-700 dark:text-amber-400">
                {form.tipoComprobante === 'SIN'
                  ? <>Con punto de venta activo y tipo SIN, los comprobantes se numerarán como <strong>SIN {String(form.puntoVenta).padStart(4,'0')}-00000001</strong> y mostrarán el aviso de que no son válidos como factura.</>
                  : <>Con punto de venta activo, los comprobantes se numerarán como <strong>{form.tipoComprobante} {String(form.puntoVenta).padStart(4,'0')}-00000001</strong>. Para emitir facturas electrónicas válidas (con CAE) se requiere la integración con AFIP WSFE — próximamente.</>
                }
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
