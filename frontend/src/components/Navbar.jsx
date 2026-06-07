import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import { notificationsApi } from '../api/notifications'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    notificationsApi.unreadCount().then(r => setUnread(r.data.count)).catch(() => {})
    const interval = setInterval(() => {
      notificationsApi.unreadCount().then(r => setUnread(r.data.count)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleOpen() {
    if (!open) {
      setOpen(true)
      setLoading(true)
      try {
        const r = await notificationsApi.list()
        setNotifications(r.data)
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    } else {
      setOpen(false)
    }
  }

  async function handleMarkRead(id) {
    try {
      await notificationsApi.markRead(id)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
      setUnread(u => Math.max(0, u - 1))
    } catch {}
  }

  async function handleMarkAll() {
    try {
      await notificationsApi.markAllRead()
      setNotifications(ns => ns.map(n => ({ ...n, read: true })))
      setUnread(0)
    } catch {}
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        title="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">Sin notificaciones</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!n.read ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const NAV_LINKS = [
  { to: '/catalogs', label: 'Catálogos' },
  { to: '/stock', label: 'Stock' },
  { to: '/locales', label: 'Locales' },
  { to: '/orders', label: 'Pedidos' },
  { to: '/profile', label: 'Mi perfil' },
  { to: '/settings', label: 'Configuración' },
]

export default function Navbar() {
  const { logout, user } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Cierra al navegar
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  function isActive(to) {
    return location.pathname.startsWith(to)
  }

  return (
    <nav className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700" ref={menuRef}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="font-bold text-gray-900 dark:text-white text-base tracking-tight shrink-0">
          Mercato
        </Link>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-5 flex-1 ml-6">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
              }`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2">
          {user?.appAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 font-medium transition-colors"
            >
              Admin
            </Link>
          )}
          <NotificationBell />
          <ThemeToggle />
          <button
            onClick={logout}
            className="hidden md:block text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            Salir
          </button>

          {/* Hamburguesa mobile */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Menú"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú mobile desplegable */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}>
              {label}
            </Link>
          ))}
          {user?.appAdmin && (
            <Link to="/admin"
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Admin
            </Link>
          )}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <button onClick={logout}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
