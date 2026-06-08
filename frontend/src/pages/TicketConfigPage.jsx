import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { ticketsApi } from '../api/tickets'

export default function TicketConfigPage() {
  const navigate = useNavigate()
  const logoRef = useRef()
  const [form, setForm] = useState({
    businessName: '', businessAddress: '', businessPhone: '',
    businessEmail: '', taxId: '', logoUrl: '', currency: '$',
    paymentMethods: 'Efectivo, Transferencia', footer: '', showCatalogQr: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    ticketsApi.getConfig()
      .then(r => setForm(f => ({ ...f, ...r.data })))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await ticketsApi.saveConfig(form)
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
      setForm(f => ({ ...f, logoUrl: data.logoUrl }))
      toast.success('Logo subido')
    } catch { toast.error('Error al subir logo') }
    finally { setUploadingLogo(false); e.target.value = '' }
  }

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
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Esta información aparece en cada ticket de venta que generes.</p>
        </div>

        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-5">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Logo del negocio</label>
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
                  <button type="button" onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                    className="ml-2 text-sm text-red-400 hover:text-red-600">Quitar</button>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PNG o JPG, máx. 2MB</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre del negocio *</label>
              <input type="text" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} required
                placeholder="Mi tienda de ropa"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Dirección</label>
              <input type="text" value={form.businessAddress} onChange={e => setForm(f => ({ ...f, businessAddress: e.target.value }))}
                placeholder="Av. Corrientes 1234, Buenos Aires"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teléfono</label>
              <input type="text" value={form.businessPhone} onChange={e => setForm(f => ({ ...f, businessPhone: e.target.value }))}
                placeholder="+54 11 1234-5678"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email del negocio</label>
              <input type="email" value={form.businessEmail} onChange={e => setForm(f => ({ ...f, businessEmail: e.target.value }))}
                placeholder="ventas@mitienda.com"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">CUIT / RUT</label>
              <input type="text" value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
                placeholder="20-12345678-9"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Moneda</label>
              <input type="text" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                placeholder="$"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Formas de pago disponibles</label>
              <input type="text" value={form.paymentMethods} onChange={e => setForm(f => ({ ...f, paymentMethods: e.target.value }))}
                placeholder="Efectivo, Transferencia, Tarjeta"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Pie del comprobante</label>
              <textarea rows={2} value={form.footer} onChange={e => setForm(f => ({ ...f, footer: e.target.value }))}
                placeholder="¡Gracias por tu compra! Conservá este comprobante."
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="showQr" checked={form.showCatalogQr}
              onChange={e => setForm(f => ({ ...f, showCatalogQr: e.target.checked }))} className="rounded" />
            <label htmlFor="showQr" className="text-sm text-gray-700 dark:text-slate-300">Mostrar QR del catálogo en el comprobante</label>
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
