import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'

function StatCard({ label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    gray: 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300',
    teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
  }
  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || colors.gray}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats()
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando estadísticas...</div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">Usuarios</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total usuarios" value={stats.totalUsers} color="blue" />
              <StatCard label="Habilitados" value={stats.enabledUsers} sub={`${stats.totalUsers - stats.enabledUsers} deshabilitados`} color="green" />
              <StatCard label="Admins" value={stats.adminUsers} color="violet" />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">Catálogos & Productos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total catálogos" value={stats.totalCatalogs} color="blue" />
              <StatCard label="Activos" value={stats.activeCatalogs} color="green" />
              <StatCard label="Con IA generada" value={stats.generatedCatalogs} color="violet" />
              <StatCard label="Productos" value={stats.totalProducts} color="orange" />
              <StatCard label="Vistas de catálogo" value={stats.totalCatalogViews} color="gray" />
              <StatCard label="Vistas de perfil" value={stats.totalProfileViews} color="teal" />
              <StatCard label="Clics WhatsApp" value={stats.totalWhatsappClicks} color="green" />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">Pedidos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                label="Pedidos generados"
                value={stats.totalOrders}
                sub="Total recibidos vía catálogos"
                color="blue"
              />
              <StatCard
                label="Respondidos en la app"
                value={stats.respondedOrders}
                sub={stats.totalOrders > 0 ? `${Math.round(stats.respondedOrders / stats.totalOrders * 100)}% de respuesta` : 'Sin pedidos aún'}
                color="green"
              />
              <StatCard
                label="Pendientes"
                value={stats.totalOrders - stats.respondedOrders}
                sub="Sin respuesta del vendedor"
                color="orange"
              />
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  )
}
