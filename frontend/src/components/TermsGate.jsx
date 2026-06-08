import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

export default function TermsGate({ children }) {
  const { user, isAuthenticated, acceptTerms } = useAuth()
  const [loading, setLoading] = useState(false)

  const needsAcceptance = isAuthenticated && user && !user.termsAccepted

  const handleAccept = async () => {
    setLoading(true)
    try {
      await acceptTerms()
    } catch {
      toast.error('Error al aceptar los términos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {children}
      {needsAcceptance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Términos y Condiciones</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Para usar Mercato debés aceptar nuestros términos</p>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed flex-1">
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">1. Aceptación</h3>
                <p>Al utilizar la plataforma, aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no podés usar el servicio.</p>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">2. Responsabilidad del contenido</h3>
                <p>Cada vendedor es el único responsable del contenido que publica en sus catálogos, incluyendo descripciones, imágenes, precios y cualquier otro material. Mercato actúa como plataforma intermediaria y no garantiza la veracidad ni calidad de los productos publicados.</p>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">3. Contenido prohibido</h3>
                <p>Queda estrictamente prohibido publicar contenido que sea ilegal, obsceno o inapropiado; infrinja derechos de terceros; constituya spam o publicidad engañosa; promueva actividades fraudulentas; o vulnere la privacidad de otras personas.</p>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">4. Sistema de moderación</h3>
                <p>Los catálogos que reciban 10 o más denuncias serán pausados automáticamente. Mercato se reserva el derecho de eliminar catálogos que violen estos términos sin previo aviso.</p>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">5. Uso del servicio</h3>
                <p>Te comprometés a utilizar Mercato únicamente para fines legítimos y comerciales. Queda prohibido intentar acceder a cuentas ajenas o interferir con el funcionamiento de la plataforma.</p>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">6. Datos personales</h3>
                <p>Tus datos son tratados de acuerdo a nuestra política de privacidad. No compartimos información personal con terceros salvo requerimiento legal.</p>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">7. Modificaciones</h3>
                <p>Mercato puede modificar estos términos en cualquier momento. Los cambios serán notificados por email y entrarán en vigencia a los 7 días de su publicación.</p>
              </section>
              <p className="text-xs text-gray-400 dark:text-slate-500 pt-2 border-t border-gray-100 dark:border-slate-700">
                Última actualización: junio 2026
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? 'Guardando...' : 'Acepto los términos y condiciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
