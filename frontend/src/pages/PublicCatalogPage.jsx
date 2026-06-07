import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { publicApi } from '../api/profile'

const STOCK_LABELS = { IN_STOCK: 'En stock', ON_DEMAND: 'A pedido' }
const STOCK_COLORS = {
  IN_STOCK: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ON_DEMAND: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function StockBadge({ stockStatus, stockCount }) {
  if (!stockStatus) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium print:border print:border-current ${STOCK_COLORS[stockStatus] || 'bg-gray-100 text-gray-600'}`}>
      {STOCK_LABELS[stockStatus] || stockStatus}
      {stockCount != null && <span>({stockCount})</span>}
    </span>
  )
}

function PriceDisplay({ price, offerPrice, className = '' }) {
  if (offerPrice != null) {
    return (
      <div className={`flex flex-col items-end ${className}`}>
        <span className="text-sm font-bold text-green-600 dark:text-green-400 leading-tight">
          ${Number(offerPrice).toLocaleString('es-AR')}
        </span>
        {price != null && (
          <span className="text-xs text-gray-400 line-through leading-tight">
            ${Number(price).toLocaleString('es-AR')}
          </span>
        )}
      </div>
    )
  }
  if (price != null) {
    return (
      <span className={`text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0 ${className}`}>
        ${Number(price).toLocaleString('es-AR')}
      </span>
    )
  }
  return null
}

function ProductCardGrid({ product, catalogName, vendorWhatsapp }) {
  function handleWhatsapp() {
    const number = vendorWhatsapp || ''
    const msg = encodeURIComponent(`Hola, vi el producto "${product.name}" en el catálogo "${catalogName}" y me interesa.`)
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col print:break-inside-avoid print:border print:border-gray-200">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{product.name}</h4>
          <PriceDisplay price={product.price} offerPrice={product.offerPrice} className="shrink-0" />
        </div>
        {product.category && (
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full self-start">{product.category}</span>
        )}
        {product.aiDescription ? (
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed flex-1">{product.aiDescription}</p>
        ) : product.description ? (
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed flex-1">{product.description}</p>
        ) : null}
        {product.showStock && <StockBadge stockStatus={product.stockStatus} stockCount={product.stockCount} />}
        {vendorWhatsapp && (
          <button onClick={handleWhatsapp}
            className="mt-1 w-full py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity print:hidden">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Consultar
          </button>
        )}
      </div>
    </div>
  )
}

function ProductCardList({ product, catalogName, vendorWhatsapp }) {
  function handleWhatsapp() {
    const number = vendorWhatsapp || ''
    const msg = encodeURIComponent(`Hola, vi el producto "${product.name}" en el catálogo "${catalogName}" y me interesa.`)
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex print:break-inside-avoid print:border print:border-gray-200">
      <div className="w-32 sm:w-44 shrink-0">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full min-h-[7rem] bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{product.name}</h4>
          <PriceDisplay price={product.price} offerPrice={product.offerPrice} className="shrink-0" />
        </div>
        {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
        {product.category && (
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full self-start">{product.category}</span>
        )}
        {product.aiDescription ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{product.aiDescription}</p>
        ) : product.description ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{product.description}</p>
        ) : null}
        <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
          {product.showStock && <StockBadge stockStatus={product.stockStatus} stockCount={product.stockCount} />}
          {vendorWhatsapp && (
            <button onClick={handleWhatsapp}
              className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-opacity print:hidden">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Consultar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function resolveBackground(catalog) {
  if (!catalog) return {}
  const type = catalog.backgroundType || 'NONE'
  if (type === 'COLOR' && catalog.backgroundColor) {
    return { backgroundColor: catalog.backgroundColor }
  }
  if ((type === 'CUSTOM' || type === 'PREDEFINED') && catalog.backgroundImageUrl) {
    return {
      backgroundImage: `url(${catalog.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return {}
}

function QRModal({ url, catalogName, onClose }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">QR del catálogo</h3>
        <img src={qrSrc} alt="QR" className="w-48 h-48 rounded-xl" />
        <p className="text-xs text-gray-400 text-center break-all">{url}</p>
        <a href={qrSrc} download={`qr-${catalogName}.png`}
          className="w-full py-2 text-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
          Descargar QR
        </a>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">Cerrar</button>
      </div>
    </div>
  )
}

function ShareButton({ url, catalogName }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    setOpen(false)
  }

  function shareWhatsapp() {
    const msg = encodeURIComponent(`Mirá el catálogo "${catalogName}": ${url}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-xl transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? 'Copiado!' : 'Compartir'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-10 w-44 overflow-hidden">
          <button onClick={copyLink} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar link
          </button>
          <button onClick={shareWhatsapp} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Compartir por WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}

export default function PublicCatalogPage() {
  const { catalogId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const viewedRef = useRef(false)

  useEffect(() => {
    publicApi.getCatalog(catalogId)
      .then(({ data: d }) => {
        setData(d)
        if (!viewedRef.current) {
          viewedRef.current = true
          publicApi.trackCatalogView(d.catalog.id)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [catalogId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400">Cargando catálogo...</div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <p className="text-2xl font-bold text-gray-900">Catálogo no encontrado</p>
      <p className="text-gray-400 text-sm">Este catálogo no existe o no está disponible.</p>
    </div>
  )

  const { catalog, vendorName, vendorSlug, vendorWhatsapp, vendorProfileImageUrl } = data
  const viewMode = catalog.viewMode || 'GRID'
  const bgStyle = resolveBackground(catalog)
  const hasBg = Object.keys(bgStyle).length > 0
  const pageUrl = window.location.href

  const allProducts = catalog.products || []
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
  const visibleProducts = activeCategory
    ? allProducts.filter(p => p.category === activeCategory)
    : allProducts

  return (
    <>
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          body { background: white !important; }
          .catalog-bg { background: white !important; background-image: none !important; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 print:hidden">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {vendorProfileImageUrl ? (
                <img src={vendorProfileImageUrl} alt={vendorName} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {vendorName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{vendorName}</p>
                {vendorSlug && (
                  <Link to={`/p/${vendorSlug}`} className="text-xs text-blue-500 hover:underline">
                    Ver perfil completo
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {vendorWhatsapp && (
                <a
                  href={`https://wa.me/${vendorWhatsapp}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
              )}
              <ShareButton url={pageUrl} catalogName={catalog.name} />
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-xl transition-colors"
                title="Ver QR del catálogo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2v-5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>
        </header>

        {/* Catalog content */}
        <div className={`flex-1 catalog-bg ${hasBg ? 'relative' : ''}`} style={bgStyle}>
          {hasBg && (
            <div className="absolute inset-0 bg-white/70 pointer-events-none" />
          )}
          <div className="relative max-w-5xl mx-auto px-4 py-8">
            {/* Catalog header */}
            <div className="mb-6 print:mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">{catalog.name}</h1>
              {catalog.description && (
                <p className="text-gray-600 text-base">{catalog.description}</p>
              )}
              {catalog.aiContent && (
                <p className="text-gray-500 text-sm italic mt-2 max-w-2xl leading-relaxed">{catalog.aiContent}</p>
              )}
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6 print:hidden">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === null
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Todos ({allProducts.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeCategory === cat
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat} ({allProducts.filter(p => p.category === cat).length})
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {visibleProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">Sin productos en este catálogo.</div>
            ) : viewMode === 'LIST' ? (
              <div className="flex flex-col gap-4">
                {visibleProducts.map(p => (
                  <ProductCardList key={p.id} product={p} catalogName={catalog.name} vendorWhatsapp={vendorWhatsapp} />
                ))}
              </div>
            ) : viewMode === 'MOSAIC' ? (
              <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                {visibleProducts.map(p => (
                  <div key={p.id} className="break-inside-avoid">
                    <ProductCardGrid product={p} catalogName={catalog.name} vendorWhatsapp={vendorWhatsapp} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visibleProducts.map(p => (
                  <ProductCardGrid key={p.id} product={p} catalogName={catalog.name} vendorWhatsapp={vendorWhatsapp} />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 bg-white print:hidden">
          Catálogo digital · {vendorName}
          {vendorSlug && (
            <> · <Link to={`/p/${vendorSlug}`} className="text-blue-500 hover:underline">Ver perfil</Link></>
          )}
        </footer>
      </div>

      {showQR && <QRModal url={pageUrl} catalogName={catalog.name} onClose={() => setShowQR(false)} />}
    </>
  )
}
