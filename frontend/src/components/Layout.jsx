import React, { useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { usePageTracking } from '../hooks/usePageTracking'

export default function Layout({ children }) {
  usePageTracking()
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebarCollapsed') === 'true'
  )

  function toggleCollapsed() {
    setCollapsed(v => {
      localStorage.setItem('sidebarCollapsed', String(!v))
      return !v
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar collapsed={collapsed} onToggle={toggleCollapsed} />
      {/* Offset: sidebar width on desktop, top bar on mobile */}
      <div className={`transition-all duration-300 ${collapsed ? 'md:pl-16' : 'md:pl-56'} pt-14 min-h-screen flex flex-col`}>
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
