import React, { useState } from 'react'
import { toast } from 'sonner'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function TermsModal() {
  const { updateTermsAccepted } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    try {
      await api.post('/auth/accept-terms')
      updateTermsAccepted()
    } catch {
      toast.error('Error al aceptar los términos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Términos y condiciones</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Por favor leé y aceptá los términos para continuar.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 dark:text-slate-300 space-y-4">
          <p>Al utilizar esta plataforma aceptás los siguientes términos de uso:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Esta herramienta es para uso comercial legítimo. Está prohibido utilizarla para publicar contenido ilegal, engañoso o que infrinja derechos de terceros.</li>
            <li>Sos responsable del contenido que publiques: productos, imágenes, descripciones y precios.</li>
            <li>Los datos de tus clientes son confidenciales. No podés compartir ni comercializar información personal de terceros obtenida a través de la plataforma.</li>
            <li>El uso de la generación de contenido por inteligencia artificial es una herramienta de apoyo. Verificá siempre el contenido generado antes de publicarlo.</li>
            <li>La plataforma puede ser modificada, suspendida o interrumpida en cualquier momento por razones técnicas o comerciales.</li>
            <li>El acceso puede ser revocado si se detectan usos que violen estos términos.</li>
          </ol>
          <p className="text-gray-400 dark:text-slate-500 text-xs">Última actualización: Junio 2025</p>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-slate-700">
          <button onClick={handleAccept} disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            {loading ? 'Procesando...' : 'Acepto los términos y condiciones'}
          </button>
        </div>
      </div>
    </div>
  )
}
