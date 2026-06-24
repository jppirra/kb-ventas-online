import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import InvoiceDocument from '../components/InvoiceDocument'

export default function PublicTicketPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/public/tickets/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError('Comprobante no encontrado o link inválido.'))
  }, [token])

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <p className="text-gray-500 text-sm">{error}</p>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-4">
          <a href="/" className="inline-flex items-center gap-2 text-indigo-600 text-xs hover:underline">
            <img src="/logo-icon.png" alt="" className="h-5 w-5 rounded object-cover" />
            Powered by Mercato
          </a>
        </div>

        <InvoiceDocument ticket={data.ticket} config={data.config} />

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by{' '}
          <a href="https://mercato.jafpsoft.com" className="text-indigo-500 hover:underline">Mercato</a>
          {' · '}Desarrollado por{' '}
          <a href="https://jafpsoft.com" className="text-indigo-500 hover:underline">JAFPSoft</a>
        </p>
      </div>
    </div>
  )
}
