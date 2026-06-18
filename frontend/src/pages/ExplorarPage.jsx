import React, { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogsApi } from '../api/catalogs'
import { RUBROS } from '../config/rubros'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

function CatalogCard({ catalog }) {
  return (
    <Link
      to={`/c/${catalog.publicId}`}
      className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-700 overflow-hidden">
        {catalog.coverImageUrl ? (
          <img
            src={catalog.coverImageUrl}
            alt={catalog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 10h16M4 14h8M4 18h5" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{catalog.name}</h3>
          {catalog.rubro && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
              {RUBROS.find(r => r.value === catalog.rubro)?.label || catalog.rubro}
            </span>
          )}
        </div>
        {catalog.description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{catalog.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-2">
          {catalog.vendorProfileImageUrl ? (
            <img src={catalog.vendorProfileImageUrl} alt={catalog.vendorName} className="w-5 h-5 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold leading-none">{catalog.vendorName?.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="text-xs text-gray-500 dark:text-slate-400 truncate">{catalog.vendorName}</span>
          {catalog.viewCount > 0 && (
            <span className="ml-auto text-xs text-gray-400 dark:text-slate-500 shrink-0">{catalog.viewCount} views</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function ExplorarPage() {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [rubro, setRubro] = useState(searchParams.get('rubro') || '')
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '')

  const fetchData = useCallback(async (rubroVal, qVal) => {
    setLoading(true)
    try {
      const { data: res } = await catalogsApi.searchCatalogs(rubroVal, qVal)
      setData(res)
    } catch {
      setData({ featured: [], results: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(rubro, q)
  }, [rubro, q, fetchData])

  function applySearch(e) {
    e.preventDefault()
    const newQ = inputValue.trim()
    setQ(newQ)
    const params = {}
    if (rubro) params.rubro = rubro
    if (newQ) params.q = newQ
    setSearchParams(params)
  }

  function selectRubro(val) {
    const newRubro = val === rubro ? '' : val
    setRubro(newRubro)
    const params = {}
    if (newRubro) params.rubro = newRubro
    if (q) params.q = q
    setSearchParams(params)
  }

  const showFeatured = !rubro && !q

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* Nav bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
        <a href="/mercato/" className="flex items-center gap-2 shrink-0">
          <img src="/logo-icon.png" alt="" className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">Mercato</span>
        </a>
        {isAuthenticated ? (
          <Link to="/dashboard" className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to app
          </Link>
        ) : (
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/login" className="text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 transition-colors">Sign in</Link>
            <Link to="/register" className="text-xs font-semibold px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">Sign up</Link>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex-1">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Explore catalogs</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Discover published catalogs from all kinds of sellers.</p>
        </div>

        {/* Search bar */}
        <form onSubmit={applySearch} className="flex gap-2 mb-5">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search by name or description..."
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Search
          </button>
          {(q || rubro) && (
            <button
              type="button"
              onClick={() => { setQ(''); setRubro(''); setInputValue(''); setSearchParams({}) }}
              className="px-3 py-2 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        {/* Rubro pills */}
        <div className="flex flex-wrap gap-2 mb-7">
          {RUBROS.map(r => (
            <button
              key={r.value}
              onClick={() => selectRubro(r.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                rubro === r.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-slate-500 text-sm">Loading...</div>
        ) : (
          <>
            {/* Featured (only when no filters active) */}
            {showFeatured && data?.featured?.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-amber-500 text-white shadow-sm">Featured</span>
                  <div className="flex-1 h-px bg-amber-200 dark:bg-amber-900/50" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {data.featured.map(c => <CatalogCard key={c.id} catalog={c} />)}
                </div>
              </div>
            )}

            {/* Results */}
            {data?.results?.length === 0 ? (
              <div className="text-center py-16 text-gray-400 dark:text-slate-500 text-sm">
                No catalogs found{rubro || q ? ' matching those filters' : ''}.
              </div>
            ) : (
              <div>
                {(rubro || q) && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-600 text-white shadow-sm">
                      {data.results.length} result{data.results.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-1 h-px bg-blue-200 dark:bg-blue-900/50" />
                  </div>
                )}
                {!rubro && !q && data?.results?.length > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-600 text-white shadow-sm">All catalogs</span>
                    <div className="flex-1 h-px bg-blue-200 dark:bg-blue-900/50" />
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {data.results.map(c => <CatalogCard key={c.id} catalog={c} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
