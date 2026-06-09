import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { publicApi } from '../api/profile'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

const PLATFORM_ICONS = {
  WHATSAPP: { label: 'WhatsApp', color: '#25D366', icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
  )},
  INSTAGRAM: { label: 'Instagram', color: '#E1306C', icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  )},
  LINKEDIN: { label: 'LinkedIn', color: '#0A66C2', icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  )},
  FACEBOOK: { label: 'Facebook', color: '#1877F2', icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )},
  TIKTOK: { label: 'TikTok', color: '#000000', icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
  )},
  WEBSITE: { label: 'Sitio web', color: '#6B7280', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  )},
}

const STOCK_LABELS = { IN_STOCK: 'En stock', ON_DEMAND: 'A pedido' }
const STOCK_COLORS = {
  IN_STOCK: 'bg-green-100 text-green-700',
  ON_DEMAND: 'bg-yellow-100 text-yellow-700',
}

function resolveBackground(catalog) {
  const type = catalog.backgroundType || 'NONE'
  if (type === 'COLOR' && catalog.backgroundColor) return { backgroundColor: catalog.backgroundColor }
  if ((type === 'CUSTOM' || type === 'PREDEFINED') && catalog.backgroundImageUrl) {
    return { backgroundImage: `url(${catalog.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return {}
}

function ProductCard({ product, catalogName, vendorWhatsapp, onWhatsappClick }) {
  function handleWhatsapp() {
    onWhatsappClick(product.id)
    const number = vendorWhatsapp || ''
    const msg = encodeURIComponent(`Hola, vi el producto "${product.name}" en tu catálogo "${catalogName}" y me interesa.`)
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{product.name}</h4>
          {product.price != null && (
            <span className="text-sm font-bold shrink-0" style={{ color: 'var(--brand-primary)' }}>
              ${Number(product.price).toLocaleString('es-AR')}
            </span>
          )}
        </div>
        {product.aiDescription ? (
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed flex-1">{product.aiDescription}</p>
        ) : product.description ? (
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed flex-1">{product.description}</p>
        ) : null}
        {product.showStock && product.stockStatus && (
          <span className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${STOCK_COLORS[product.stockStatus] || 'bg-gray-100 text-gray-600'}`}>
            {STOCK_LABELS[product.stockStatus] || product.stockStatus}
            {product.stockCount != null && ` (${product.stockCount})`}
          </span>
        )}
        <button
          onClick={handleWhatsapp}
          className="mt-2 w-full py-2 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Consultar
        </button>
      </div>
    </div>
  )
}

function CatalogSection({ catalog, vendorWhatsapp, onWhatsappClick, onView }) {
  const viewed = useRef(false)

  useEffect(() => {
    if (!viewed.current) {
      viewed.current = true
      onView(catalog.id)
    }
  }, [catalog.id])

  const [viewMode, setViewMode] = useState(catalog.viewMode || 'GRID')
  const bgStyle = resolveBackground(catalog)
  const hasBg = Object.keys(bgStyle).length > 0

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{catalog.name}</h2>
          {catalog.description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{catalog.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/c/${catalog.publicId}`} target="_blank"
            className="text-xs px-2.5 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver catalogo
          </Link>
          <button onClick={() => setViewMode('GRID')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'GRID' ? 'bg-gray-200 dark:bg-slate-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button onClick={() => setViewMode('LIST')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'LIST' ? 'bg-gray-200 dark:bg-slate-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>
      </div>

      {catalog.aiContent && (
        <p className="text-sm text-gray-600 dark:text-slate-400 italic mb-5 leading-relaxed">{catalog.aiContent}</p>
      )}

      <div className={hasBg ? 'relative rounded-2xl overflow-hidden p-4' : ''} style={hasBg ? bgStyle : {}}>
        {hasBg && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 pointer-events-none" />}
        <div className="relative">
          {viewMode === 'LIST' ? (
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {catalog.products.map(p => (
                <div key={p.id} className="snap-start shrink-0 w-56">
                  <ProductCard product={p} catalogName={catalog.name}
                    vendorWhatsapp={vendorWhatsapp} onWhatsappClick={onWhatsappClick} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {catalog.products.map(p => (
                <ProductCard key={p.id} product={p} catalogName={catalog.name}
                  vendorWhatsapp={vendorWhatsapp} onWhatsappClick={onWhatsappClick} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function PublicProfilePage() {
  const { isAuthenticated } = useAuth()
  const { slug } = useParams()
  const location = useLocation()
  const catalogNotFound = location.state?.catalogNotFound
  const catalogNotFoundName = location.state?.catalogName
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    publicApi.getProfile(slug)
      .then(({ data }) => setProfile(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Inyecta CSS variables de marca en :root y las limpia al desmontar
  useEffect(() => {
    if (!profile) return
    const root = document.documentElement
    root.style.setProperty('--brand-primary', profile.brandColorPrimary || '#2563eb')
    root.style.setProperty('--brand-secondary', profile.brandColorSecondary || '#7c3aed')
    return () => {
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-secondary')
    }
  }, [profile])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="text-gray-400 dark:text-slate-500">Cargando perfil...</div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950">
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Perfil no encontrado</p>
      <p className="text-gray-400 dark:text-slate-500 text-sm">La URL <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">/p/{slug}</code> no existe.</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* Mercato brand bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
        <a href="/mercato/" title="Conocer más sobre Mercato" className="flex items-center gap-2 shrink-0">
          <img src="/logo-icon.png" alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">Mercato</span>
        </a>
        {isAuthenticated ? (
          <Link to="/dashboard" className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Volver a la app
          </Link>
        ) : (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">¿Querés hacer crecer tu negocio?</span>
            <Link to="/login" className="text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/register" className="text-xs font-semibold px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Registrarse
            </Link>
          </div>
        )}
      </div>

      {/* Banner de catálogo no encontrado */}
      {catalogNotFound && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-sm text-amber-800">
            {catalogNotFoundName
              ? `El catálogo "${catalogNotFoundName}" ya no está disponible.`
              : 'El catálogo que buscás ya no está disponible.'
            }
            {' '}Te redirigimos a la tienda de <span className="font-semibold">{profile?.name}</span>.
          </p>
        </div>
      )}
      {/* Banner */}
      <div className="relative w-full" style={{ aspectRatio: '16/5', maxHeight: 280 }}>
        {profile.bannerImageUrl ? (
          <img src={profile.bannerImageUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }} />
        )}
      </div>

      {/* Profile header */}
      <div className="max-w-4xl mx-auto w-full px-4">
        <div className="flex items-end gap-4 -mt-10 mb-4">
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={profile.name}
              className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-950 object-cover shadow-md shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-950 shadow-md shrink-0 flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
              {profile.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{profile.name}</h1>
          </div>
        </div>

        {profile.bio && (
          <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4 max-w-xl">{profile.bio}</p>
        )}

        {/* Social links */}
        {profile.socialLinks?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {profile.socialLinks.map((link, i) => {
              const meta = PLATFORM_ICONS[link.platform]
              return (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: meta?.color || 'var(--brand-primary)' }}>
                  {meta?.icon}
                  {meta?.label || link.platform}
                </a>
              )
            })}
          </div>
        )}

        {/* Catalogs */}
        {profile.catalogs?.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <p>Este vendedor aún no publicó catálogos.</p>
          </div>
        ) : (
          profile.catalogs?.map(catalog => (
            <CatalogSection
              key={catalog.id}
              catalog={catalog}
              vendorWhatsapp={profile.whatsappNumber}
              onWhatsappClick={publicApi.trackWhatsappClick}
              onView={publicApi.trackCatalogView}
            />
          ))
        )}
      </div>

      <Footer />
    </div>
  )
}
