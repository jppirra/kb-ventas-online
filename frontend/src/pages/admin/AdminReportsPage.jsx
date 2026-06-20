import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'
import { fmtDateOnly } from '../../utils/date'

const REASON_LABEL = {
  inappropriate: 'Contenido inapropiado',
  spam: 'Spam / Publicidad engañosa',
  fake: 'Información falsa',
  scam: 'Posible estafa',
  other: 'Otro',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await adminApi.reports()
      setReports(data)
    } catch {
      toast.error('Error al cargar denuncias')
    } finally {
      setLoading(false)
    }
  }

  const filtered = reports.filter(r =>
    (r.catalogName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.vendorEmail || '').toLowerCase().includes(search.toLowerCase())
  )

  // Agrupar por catalogId para obtener la cantidad de catálogos únicos
  const uniqueCatalogs = new Set(reports.map(r => r.catalogId)).size

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Denuncias</h1>
        <span className="text-sm text-gray-400 dark:text-slate-500">{reports.length} en total · {uniqueCatalogs} catálogos afectados</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Total denuncias</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueCatalogs}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Catálogos reportados</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {new Set(reports.filter(r => r.totalReportsForCatalog >= 10).map(r => r.catalogId)).size}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Catálogos pausados</p>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por catálogo o vendedor..."
        className="w-full max-w-sm px-3 py-2 mb-4 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Catálogo</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Vendedor</th>
                <th className="px-4 py-3 text-center">Motivo</th>
                <th className="px-4 py-3 text-center">Total denuncias</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Detalles</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{r.catalogName}</p>
                    <a
                      href={r.catalogPublicId ? `/c/${r.catalogPublicId}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Ver catálogo
                    </a>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-700 dark:text-slate-300 text-sm">{r.vendorName}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{r.vendorEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-sm ${r.totalReportsForCatalog >= 10 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-300'}`}>
                      {r.totalReportsForCatalog}
                    </span>
                    {r.totalReportsForCatalog >= 10 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                        Pausado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-gray-600 dark:text-slate-400 text-xs max-w-xs truncate">{r.details || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400 dark:text-slate-500 hidden sm:table-cell">
                    {fmtDateOnly(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm">No hay denuncias registradas.</p>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
