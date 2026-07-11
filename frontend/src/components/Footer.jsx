import React from 'react'

export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-10 py-4 px-6 border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      <p className="text-center text-xs text-gray-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()}{' '}
        <a
          href="https://jafpsoft.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          JAFPSoft
        </a>
        {' — '}Todos los derechos reservados
        <span className="ml-3 opacity-50">{__APP_VERSION__}</span>
      </p>
    </footer>
  )
}
