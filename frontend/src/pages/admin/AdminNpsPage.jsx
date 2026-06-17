import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { ratingsApi } from '../../api/ratings'
import { toast } from 'sonner'

function StarRow({ score, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-8 text-right text-gray-600 dark:text-slate-400 font-medium">{score}★</span>
      <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div className="h-2.5 bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-gray-500 dark:text-slate-400">{count} ({pct}%)</span>
    </div>
  )
}

export default function AdminNpsPage() {
  const [ratings, setRatings] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([ratingsApi.all(), ratingsApi.summary()])
      .then(([r, s]) => { setRatings(r.data); setSummary(s.data) })
      .catch(() => toast.error('Error al cargar valoraciones'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">NPS — Valoraciones</h1>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : summary && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{summary.average.toFixed(1)}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Total</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(s => (
                  <StarRow key={s} score={s} count={summary.distribution?.[s] ?? 0} total={summary.total} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Todas las valoraciones</h2>
          </div>
          {ratings.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 dark:text-slate-500 text-center">Sin valoraciones aún</p>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-slate-700">
              {ratings.map(r => (
                <li key={r.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.userName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{r.userEmail}</p>
                      {r.comment && <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{r.comment}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-lg ${i < r.score ? 'text-yellow-400' : 'text-gray-200 dark:text-slate-600'}`}>★</span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
