import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { dashboardApi } from '../api/dashboard'

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5`}>
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    dashboardApi.getStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Hola, {user?.userName}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
          Bienvenido a Mercato — generador de catálogos de ventas con inteligencia artificial.
        </p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Catálogos"
              value={stats.totalCatalogs}
              color="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              label="Productos"
              value={stats.totalProducts}
              color="text-violet-600 dark:text-violet-400"
            />
            <StatCard
              label="Pedidos"
              value={stats.totalOrders}
              sub={stats.pendingOrders > 0 ? `${stats.pendingOrders} pendiente${stats.pendingOrders !== 1 ? 's' : ''}` : null}
              color={stats.pendingOrders > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}
            />
            <StatCard
              label="Visitas"
              value={stats.totalViews != null ? Number(stats.totalViews).toLocaleString('es-AR') : '0'}
              color="text-gray-700 dark:text-slate-200"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div onClick={() => navigate('/catalogs')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 p-6 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Mis catálogos
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Creá catálogos, importá desde Excel y generá descripciones con IA.
                </p>
              </div>
            </div>
          </div>

          <div onClick={() => navigate('/orders')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-500 p-6 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                  Pedidos
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Gestioná los pedidos recibidos y respondé a tus clientes.
                </p>
              </div>
            </div>
          </div>

          <div onClick={() => navigate('/stock')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-500 p-6 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Stock
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Administrá tu repositorio de productos con precios y variantes.
                </p>
              </div>
            </div>
          </div>

          <div onClick={() => navigate('/profile')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 p-6 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Mi perfil público
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Configurá tu página de vendedor: foto, banner, colores y redes sociales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
