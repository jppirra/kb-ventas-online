import React from 'react'

export default function Footer() {
  return (
    <footer className="mt-auto py-4 px-6 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
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
      </p>
    </footer>
  )
}
