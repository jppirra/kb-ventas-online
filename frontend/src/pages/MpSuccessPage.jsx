import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function MpSuccessPage() {
  const [params] = useSearchParams()
  const shop = params.get('shop') ? decodeURIComponent(params.get('shop')) : null
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 py-16">

      {/* Logo Mercato */}
      <Link to="/" className="mb-8">
        <img src="/logo-text.png" alt="Mercato" className="h-10 object-contain" />
      </Link>

      {/* Card pago exitoso */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">¡Pago exitoso!</h1>
          {shop ? (
            <p className="text-gray-500 mt-2">Gracias por tu compra en <span className="font-semibold text-gray-800">{shop}</span>. Tu pago fue procesado por Mercado Pago.</p>
          ) : (
            <p className="text-gray-500 mt-2">Tu pago fue procesado correctamente por Mercado Pago.</p>
          )}
        </div>

        <div className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Pago procesado de forma segura por Mercado Pago
        </div>
      </div>

      {/* CTA vendedores */}
      <div className="mt-6 max-w-md w-full bg-white rounded-3xl border border-blue-100 shadow-sm p-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-blue-600">Para vendedores</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">¿Tenés un negocio?</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Publicá tu catálogo online, recibí pedidos y cobrá con Mercado Pago —
          todo desde un solo lugar. <span className="font-semibold text-gray-700">Gratis, sin comisiones.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Empezá gratis
          </Link>
          <Link
            to="/explorer"
            className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Ver catálogos
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 flex flex-col items-center gap-1.5 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <Link to="/" className="text-blue-500 hover:underline font-medium">Mercato</Link>
        </div>
        <div className="flex items-center gap-1">
          <span>Desarrollado por</span>
          <a href="https://jafpsoft.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">JAFPSoft</a>
        </div>
        <p>&copy; {year} JAFPSoft. Todos los derechos reservados.</p>
      </div>

    </div>
  )
}
