import React from 'react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Términos y Condiciones</h1>
          <Link to="/register" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Volver al registro
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 space-y-6 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Aceptación</h2>
            <p>Al registrarte en Mercato y utilizar la plataforma, aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no podés usar el servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Responsabilidad del contenido</h2>
            <p>Cada vendedor es el único responsable del contenido que publica en sus catálogos, incluyendo descripciones, imágenes, precios y cualquier otro material. Mercato actúa como plataforma intermediaria y no garantiza la veracidad ni calidad de los productos publicados.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Contenido prohibido</h2>
            <p>Queda estrictamente prohibido publicar contenido que:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Sea ilegal, obsceno o inapropiado</li>
              <li>Infrinja derechos de terceros (marcas, derechos de autor)</li>
              <li>Constituya spam, publicidad engañosa o información falsa</li>
              <li>Promueva actividades fraudulentas o estafas</li>
              <li>Vulnere la privacidad de otras personas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Sistema de moderación</h2>
            <p>Los catálogos que reciban 10 o más denuncias de usuarios serán pausados automáticamente para revisión. El vendedor será notificado por email. Mercato se reserva el derecho de eliminar catálogos que violen estos términos sin previo aviso.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. Uso del servicio</h2>
            <p>Te comprometés a utilizar Mercato únicamente para fines legítimos y comerciales. Queda prohibido intentar acceder a cuentas ajenas, realizar ingeniería inversa o interferir con el funcionamiento de la plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">6. Datos personales</h2>
            <p>Tus datos son tratados de acuerdo a nuestra política de privacidad. No compartimos información personal con terceros salvo requerimiento legal.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7. Modificaciones</h2>
            <p>Mercato puede modificar estos términos en cualquier momento. Los cambios serán notificados por email y entrarán en vigencia a los 7 días de su publicación.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">8. Contacto</h2>
            <p>Para consultas sobre estos términos, contactanos a través de la plataforma o al email de soporte indicado en el sitio.</p>
          </section>

          <p className="text-xs text-gray-400 dark:text-slate-500 pt-4 border-t border-gray-100 dark:border-slate-700">
            Última actualización: junio 2026
          </p>
        </div>
      </div>
    </div>
  )
}
