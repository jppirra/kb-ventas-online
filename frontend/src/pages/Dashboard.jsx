import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Hola, {user?.userName}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
          Bienvenido a CatalogIA — generador de catálogos de ventas con inteligencia artificial.
        </p>

        <div
          onClick={() => navigate('/catalogs')}
          className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 p-6 transition-colors"
        >
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
                Creá y gestioná catálogos. Importá desde Excel o cargá productos manualmente y generá descripciones con IA.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
