import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { dashboardApi } from '../api/dashboard'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmt(n) {
  return Number(n || 0).toLocaleString('es-AR')
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function monthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${months[parseInt(m, 10) - 1]} ${y}`
}

function StatCard({ label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 ${onClick ? 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors' : ''}`}
    >
      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function NavCard({ label, desc, icon, color, hoverColor, bgColor, onClick }) {
  return (
    <div onClick={onClick}
      className={`group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 ${hoverColor} p-6 transition-colors`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h2 className={`font-semibold text-gray-900 dark:text-white ${color} transition-colors`}>{label}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonth)
  const [stats, setStats] = useState(null)
  const [topProducts, setTopProducts] = useState(null)

  useEffect(() => {
    dashboardApi.getStats(month).then(r => setStats(r.data)).catch(() => {})
  }, [month])

  useEffect(() => {
    dashboardApi.getTopProducts().then(r => setTopProducts(r.data)).catch(() => {})
  }, [])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Hola, {user?.userName}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Bienvenido a Mercato — herramientas digitales para emprendedores.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-slate-400 font-medium">Período</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {stats && (
          <>
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">General</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                label="Catálogos"
                value={fmt(stats.totalCatalogs)}
                color="text-blue-600 dark:text-blue-400"
                onClick={() => navigate('/catalogs')}
              />
              <StatCard
                label="Productos"
                value={fmt(stats.totalProducts)}
                color="text-violet-600 dark:text-violet-400"
                onClick={() => navigate('/stock')}
              />
              <StatCard
                label="Pedidos"
                value={fmt(stats.totalOrders)}
                sub={stats.pendingOrders > 0 ? `${stats.pendingOrders} pendiente${stats.pendingOrders !== 1 ? 's' : ''}` : null}
                color={stats.pendingOrders > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}
                onClick={() => navigate('/orders')}
              />
              <StatCard
                label="Visitas"
                value={stats.totalViews != null ? fmt(stats.totalViews) : '0'}
                color="text-gray-700 dark:text-slate-200"
              />
            </div>

            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              {monthLabel(stats.month)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <StatCard
                label="Ventas"
                value={fmt(stats.totalTickets)}
                sub="tickets emitidos"
                color="text-emerald-600 dark:text-emerald-400"
                onClick={() => navigate('/tickets')}
              />
              <StatCard
                label="Facturado"
                value={fmtMoney(stats.totalRevenue)}
                sub="sin cancelados"
                color="text-emerald-700 dark:text-emerald-300"
                onClick={() => navigate('/tickets')}
              />
              <StatCard
                label="Clientes"
                value={fmt(stats.totalCustomers)}
                sub="únicos del período"
                color="text-pink-600 dark:text-pink-400"
                onClick={() => navigate('/customers')}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NavCard
            label="Mis catálogos"
            desc="Creá catálogos, importá desde Excel y generá descripciones con IA."
            color="group-hover:text-blue-600 dark:group-hover:text-blue-400"
            hoverColor="hover:border-blue-400 dark:hover:border-blue-500"
            bgColor="bg-blue-100 dark:bg-blue-900/40"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            onClick={() => navigate('/catalogs')}
          />
          <NavCard
            label="Pedidos"
            desc="Gestioná los pedidos recibidos y respondé a tus clientes."
            color="group-hover:text-yellow-600 dark:group-hover:text-yellow-400"
            hoverColor="hover:border-yellow-400 dark:hover:border-yellow-500"
            bgColor="bg-yellow-100 dark:bg-yellow-900/40"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            onClick={() => navigate('/orders')}
          />
          <NavCard
            label="Stock"
            desc="Administrá tu repositorio de productos con precios y variantes."
            color="group-hover:text-green-600 dark:group-hover:text-green-400"
            hoverColor="hover:border-green-400 dark:hover:border-green-500"
            bgColor="bg-green-100 dark:bg-green-900/40"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            onClick={() => navigate('/stock')}
          />
          <NavCard
            label="Facturación"
            desc="Emitir tickets de venta y configurar datos del negocio."
            color="group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
            hoverColor="hover:border-emerald-400 dark:hover:border-emerald-500"
            bgColor="bg-emerald-100 dark:bg-emerald-900/40"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            onClick={() => navigate('/tickets')}
          />
          <NavCard
            label="Clientes"
            desc="Historial de clientes y compras registradas en tickets."
            color="group-hover:text-pink-600 dark:group-hover:text-pink-400"
            hoverColor="hover:border-pink-400 dark:hover:border-pink-500"
            bgColor="bg-pink-100 dark:bg-pink-900/40"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            onClick={() => navigate('/customers')}
          />
          <NavCard
            label="Mi perfil público"
            desc="Configurá tu página de vendedor: foto, banner, colores y redes sociales."
            color="group-hover:text-violet-600 dark:group-hover:text-violet-400"
            hoverColor="hover:border-violet-400 dark:hover:border-violet-500"
            bgColor="bg-violet-100 dark:bg-violet-900/40"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            onClick={() => navigate('/profile')}
          />
        </div>

        {/* Top / Least sold products */}
        {topProducts && (topProducts.top.length > 0 || topProducts.least.length > 0) && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topProducts.top.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Más vendidos</h2>
                <ol className="space-y-2">
                  {topProducts.top.map((p, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-slate-300 truncate">{p.name}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400 shrink-0">{p.totalSold} u.</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {topProducts.least.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Menos vendidos</h2>
                <ol className="space-y-2">
                  {topProducts.least.map((p, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-slate-300 truncate">{p.name}</span>
                      <span className="text-sm font-semibold text-orange-500 dark:text-orange-400 shrink-0">{p.totalSold} u.</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
