import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { logout, user } = useAuth()
  const location = useLocation()

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        location.pathname.startsWith(to)
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
            CatalogIA
          </Link>
          {navLink('/catalogs', 'Catálogos')}
          {navLink('/repositorio', 'Repositorio')}
          {navLink('/profile', 'Mi perfil')}
        </div>
        <div className="flex items-center gap-2">
          {user?.appAdmin && (
            <Link
              to="/admin"
              className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 font-medium transition-colors"
            >
              Admin
            </Link>
          )}
          <ThemeToggle />
          <button
            onClick={logout}
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
