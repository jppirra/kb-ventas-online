import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../api/axios'

function TermsModal({ onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Términos y Condiciones</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Leé y aceptá para poder registrarte</p>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed flex-1">
          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">1. Aceptación</h3>
            <p>Al registrarte en Mercato y utilizar la plataforma, aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no podés usar el servicio.</p>
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

        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            No acepto
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            Acepto
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Revisá tu correo</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">Te enviamos un link para activar tu cuenta.</p>
        <Link to="/login" className="mt-6 inline-block text-indigo-600 hover:underline text-sm">Volver al login</Link>
      </div>
    </div>
  )

  return (
    <>
      {showTermsModal && (
        <TermsModal
          onAccept={() => { setTermsAccepted(true); setShowTermsModal(false) }}
          onDecline={() => navigate('/login')}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Crear cuenta</h1>
          {!termsAccepted && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 mb-4">
              Debés aceptar los términos y condiciones para registrarte.{' '}
              <button onClick={() => setShowTermsModal(true)} className="underline font-medium">Ver términos</button>
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Nombre', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Contraseña', key: 'password', type: 'password' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  required className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <button type="submit" disabled={loading || !termsAccepted}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
            ¿Ya tenés cuenta? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </>
  )
}
