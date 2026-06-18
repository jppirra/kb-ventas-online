import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import { notificationsApi } from '../api/notifications'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IC = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  catalogs: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  stock: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  locales: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  orders: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  tickets: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  profile: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  admin: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  contact: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  collaborators: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  customers: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  chevronLeft: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  chevronRight: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  menu: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  bell: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
}

const NAV_LINKS = [
  { to: '/dashboard', label: 'Inicio',        icon: IC.dashboard },
  { to: '/catalogs',  label: 'Catálogos',     icon: IC.catalogs  },
  { to: '/stock',     label: 'Stock',         icon: IC.stock     },
  { to: '/locales',   label: 'Locales',       icon: IC.locales   },
  { to: '/orders',    label: 'Pedidos',       icon: IC.orders    },
  { to: '/customers', label: 'Clientes',      icon: IC.customers },
  { to: '/tickets',   label: 'Facturación',   icon: IC.tickets   },
  { to: '/collaborators', label: 'Colaboradores', icon: IC.collaborators },
  { to: '/profile',       label: 'Mi perfil',     icon: IC.profile       },
  { to: '/settings',      label: 'Configuración', icon: IC.settings      },
  { to: '/contact',       label: 'Contacto',      icon: IC.contact       },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const s = String(dateStr)
  const d = new Date(s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s) ? s : s + 'Z')
  const diff = (Date.now() - d) / 1000
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
  const stompRef = useRef(null)

  useEffect(() => {
    notificationsApi.unreadCount().then(r => setUnread(r.data.count)).catch(() => {})

    const token = localStorage.getItem('token')
    if (!token) return

    const wsUrl = import.meta.env.VITE_WS_URL
    if (!wsUrl) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${wsUrl}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 10000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (msg) => {
          const n = JSON.parse(msg.body)
          setNotifications(prev => [n, ...prev])
          setUnread(u => u + 1)
        })
      },
    })
    client.activate()
    stompRef.current = client
    return () => client.deactivate()
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
      } catch { setNotifications([]) }
      finally { setLoading(false) }
    } else { setOpen(false) }
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
      <button onClick={handleOpen} title="Notificaciones"
        className="relative flex items-center justify-center p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
        {IC.bell}
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-500 hover:text-blue-600">Marcar todas leídas</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">Sin notificaciones</div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => !n.read && handleMarkRead(n.id)}
                className={`px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!n.read ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sidebar logo ──────────────────────────────────────────────────────────────
function SidebarLogo({ collapsed }) {
  return (
    <a href="/mercato/" title="Conocer más sobre Mercato" className="flex items-center gap-2.5 min-w-0">
      <img src="/logo-icon.png" alt="Mercato"
        className={`rounded-xl object-cover shrink-0 transition-all duration-300 ${collapsed ? 'h-10 w-10' : 'h-14 w-14'}`} />
      {!collapsed && (
        <span className="font-bold text-gray-900 dark:text-white text-xl tracking-tight shrink-0">Mercato</span>
      )}
    </a>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Navbar({ collapsed, onToggle }) {
  const { logout, user } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  function isActive(to) { return location.pathname.startsWith(to) }

  const linkClass = (to) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive(to)
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
    } ${collapsed ? 'justify-center' : ''}`

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo + toggle */}
      <div className={`flex items-center border-b border-gray-100 dark:border-slate-800 h-16 px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <SidebarLogo collapsed={collapsed} />
        <button onClick={onToggle}
          className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shrink-0 ${collapsed ? 'mt-0' : ''}`}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}>
          {collapsed ? IC.chevronRight : IC.chevronLeft}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <Link key={to} to={to} title={collapsed ? label : undefined} className={linkClass(to)}>
            {icon}
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        ))}

        {user?.appAdmin && (
          <Link to="/admin" title={collapsed ? 'Admin' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${collapsed ? 'justify-center' : ''}`}>
            {IC.admin}
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Bottom: logout */}
      <div className="border-t border-gray-100 dark:border-slate-800 py-2 px-2">
        <button onClick={logout} title={collapsed ? 'Cerrar sesión' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}>
          {IC.logout}
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Top header bar (all screen sizes) ─────────────────────────── */}
      <div className={`fixed top-0 right-0 z-30 h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center px-3 gap-2 transition-all duration-300 left-0 ${collapsed ? 'md:left-16' : 'md:left-56'}`}>
        {/* Mobile only: hamburger + logo */}
        <button onClick={() => setMobileOpen(v => !v)}
          className="md:hidden p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          {IC.menu}
        </button>
        <a href="/mercato/" title="Conocer más sobre Mercato" className="md:hidden flex items-center gap-2">
          <img src="/logo-icon.png" alt="" className="h-9 w-9 rounded-lg object-cover" />
          <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">Mercato</span>
        </a>

        {/* Right side: notification bell + theme toggle */}
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className={`
        fixed left-0 top-0 h-[100dvh] z-40
        bg-white dark:bg-slate-900
        border-r border-gray-200 dark:border-slate-700
        transition-all duration-300
        w-64 md:w-auto
        ${collapsed ? 'md:w-16' : 'md:w-56'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>
    </>
  )
}
