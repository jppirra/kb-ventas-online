import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '../api/profile'

const STOCK_LABELS = { IN_STOCK: 'En stock', ON_DEMAND: 'A pedido' }
const STOCK_COLORS = {
  IN_STOCK: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ON_DEMAND: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function StockBadge({ stockStatus, stockCount }) {
  if (!stockStatus) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STOCK_COLORS[stockStatus] || 'bg-gray-100 text-gray-600'}`}>
      {STOCK_LABELS[stockStatus] || stockStatus}
      {stockCount != null && <span>({stockCount})</span>}
    </span>
  )
}

function DiscountBadge({ price, offerPrice }) {
  if (!price || !offerPrice) return null
  const pct = Math.round((1 - Number(offerPrice) / Number(price)) * 100)
  if (pct <= 0) return null
  return (
    <span className="inline-block px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-md leading-none">
      -{pct}%
    </span>
  )
}

function PriceDisplay({ price, offerPrice, size = 'sm' }) {
  const bold = size === 'base' ? 'text-base' : 'text-sm'
  if (offerPrice != null) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1">
          <DiscountBadge price={price} offerPrice={offerPrice} />
          <span className={`${bold} font-bold text-green-600 dark:text-green-400 leading-tight`}>
            ${Number(offerPrice).toLocaleString('es-AR')}
          </span>
        </div>
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
      <span className={`${bold} font-bold text-blue-600 dark:text-blue-400 shrink-0`}>
        ${Number(price).toLocaleString('es-AR')}
      </span>
    )
  }
  return null
}

// Gallery helpers
function parseExtraImages(json) {
  try { return JSON.parse(json) || [] } catch { return [] }
}

function isYouTube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\s]+)/)
  return m ? m[1] : null
}

function getGalleryItems(product) {
  const items = []
  if (product.imageUrl) items.push({ type: 'image', url: product.imageUrl })
  parseExtraImages(product.extraImagesJson).forEach(url => items.push({ type: 'image', url }))
  if (product.videoUrl) {
    items.push({ type: isYouTube(product.videoUrl) ? 'youtube' : 'video', url: product.videoUrl })
  }
  return items
}

function LightboxModal({ items, startIndex, productName, onClose }) {
  const [current, setCurrent] = useState(startIndex)

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent(c => Math.min(items.length - 1, c + 1)), [items.length])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  const item = items[current]

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white font-medium text-sm truncate">{productName}</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-xs">{current + 1} / {items.length}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-12" onClick={e => e.stopPropagation()}>
        {/* Prev arrow */}
        {current > 0 && (
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="max-w-3xl w-full flex items-center justify-center">
          {item.type === 'image' && (
            <img src={item.url} alt={productName}
              className="max-h-[65vh] max-w-full object-contain rounded-xl select-none"
              draggable={false} />
          )}
          {item.type === 'youtube' && (
            <div className="w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(item.url)}?autoplay=1`}
                title={productName}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-xl"
              />
            </div>
          )}
          {item.type === 'video' && (
            <video src={item.url} controls autoPlay
              className="max-h-[65vh] max-w-full rounded-xl">
              Tu navegador no soporta video.
            </video>
          )}
        </div>

        {/* Next arrow */}
        {current < items.length - 1 && (
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex gap-2 justify-center px-4 py-3 shrink-0 overflow-x-auto" onClick={e => e.stopPropagation()}>
          {items.map((it, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === current ? 'border-white' : 'border-transparent opacity-60 hover:opacity-80'}`}>
              {it.type === 'image' ? (
                <img src={it.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Variant selector
function parseVariants(json) {
  try { return JSON.parse(json) || [] } catch { return [] }
}

function VariantSelector({ variantsJson, selected, onChange }) {
  const variants = parseVariants(variantsJson)
  if (!variants.length) return null
  return (
    <div className="space-y-2 mt-1">
      {variants.map(v => (
        <div key={v.name}>
          <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{v.name}</p>
          <div className="flex flex-wrap gap-1">
            {v.options.map(opt => (
              <button key={opt} type="button"
                onClick={() => onChange({ ...selected, [v.name]: opt })}
                className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                  selected[v.name] === opt
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                    : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-400'
                }`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AddToCartButton({ inCart, onAdd, onRemove, hasVariants, variantSelected }) {
  const allSelected = !hasVariants || variantSelected
  if (inCart) {
    return (
      <button onClick={onRemove}
        className="mt-1 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors print:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Agregado
      </button>
    )
  }
  return (
    <button onClick={allSelected ? onAdd : undefined}
      disabled={!allSelected}
      className={`mt-1 w-full py-2 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors print:hidden ${
        allSelected
          ? 'bg-gray-900 hover:bg-gray-700 dark:bg-slate-600 dark:hover:bg-slate-500'
          : 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'
      }`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {allSelected ? 'Agregar al pedido' : 'Elegí variante'}
    </button>
  )
}

function ProductCardGrid({ product, catalogName, vendorWhatsapp, inCart, selectedVariants, onVariantChange, onAdd, onRemove, onOpenGallery }) {
  const galleryItems = getGalleryItems(product)
  const hasGallery = galleryItems.length > 1
  const variants = parseVariants(product.variantsJson)
  const hasVariants = variants.length > 0
  const variantLabel = Object.entries(selectedVariants || {}).map(([k, v]) => `${k}: ${v}`).join(', ')

  function handleWhatsapp() {
    const msg = encodeURIComponent(`Hola, vi el producto "${product.name}" en el catálogo "${catalogName}" y me interesa.`)
    window.open(`https://wa.me/${vendorWhatsapp}?text=${msg}`, '_blank')
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden flex flex-col print:break-inside-avoid transition-colors ${inCart ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-gray-100 dark:border-slate-700'}`}>
      {/* Image */}
      <div className="relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover cursor-pointer"
            onClick={() => galleryItems.length > 0 && onOpenGallery(galleryItems, 0)} />
        ) : (
          <div className="w-full aspect-square bg-gray-100 dark:bg-slate-700 flex items-center justify-center cursor-pointer"
            onClick={() => galleryItems.length > 0 && onOpenGallery(galleryItems, 0)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {hasGallery && (
          <button onClick={() => onOpenGallery(galleryItems, 0)}
            className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 print:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {galleryItems.length}
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{product.name}</h4>
          <PriceDisplay price={product.price} offerPrice={product.offerPrice} />
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
        {hasVariants && (
          <VariantSelector variantsJson={product.variantsJson} selected={selectedVariants || {}} onChange={onVariantChange} />
        )}
        <AddToCartButton inCart={inCart} onAdd={onAdd} onRemove={onRemove} hasVariants={hasVariants}
          variantSelected={!hasVariants || (selectedVariants && Object.keys(selectedVariants).length === variants.length)} />
        {vendorWhatsapp && (
          <button onClick={handleWhatsapp}
            className="w-full py-1.5 rounded-xl border border-green-500 text-green-600 dark:text-green-400 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors print:hidden">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Consultar individualmente
          </button>
        )}
      </div>
    </div>
  )
}

function ProductCardList({ product, catalogName, vendorWhatsapp, inCart, selectedVariants, onVariantChange, onAdd, onRemove, onOpenGallery }) {
  const galleryItems = getGalleryItems(product)
  const hasGallery = galleryItems.length > 1
  const variants = parseVariants(product.variantsJson)
  const hasVariants = variants.length > 0

  function handleWhatsapp() {
    const msg = encodeURIComponent(`Hola, vi el producto "${product.name}" en el catálogo "${catalogName}" y me interesa.`)
    window.open(`https://wa.me/${vendorWhatsapp}?text=${msg}`, '_blank')
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden flex print:break-inside-avoid transition-colors ${inCart ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-gray-100 dark:border-slate-700'}`}>
      <div className="w-32 sm:w-44 shrink-0 relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover cursor-pointer"
            onClick={() => galleryItems.length > 0 && onOpenGallery(galleryItems, 0)} />
        ) : (
          <div className="w-full h-full min-h-[7rem] bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {hasGallery && (
          <button onClick={() => onOpenGallery(galleryItems, 0)}
            className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md flex items-center gap-1 print:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {galleryItems.length}
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{product.name}</h4>
          <PriceDisplay price={product.price} offerPrice={product.offerPrice} size="base" />
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
        {product.showStock && <StockBadge stockStatus={product.stockStatus} stockCount={product.stockCount} />}
        {hasVariants && (
          <VariantSelector variantsJson={product.variantsJson} selected={selectedVariants || {}} onChange={onVariantChange} />
        )}
        <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap print:hidden">
          <AddToCartButton inCart={inCart} onAdd={onAdd} onRemove={onRemove} hasVariants={hasVariants}
            variantSelected={!hasVariants || (selectedVariants && Object.keys(selectedVariants).length === variants.length)} />
          {vendorWhatsapp && (
            <button onClick={handleWhatsapp}
              className="px-3 py-1.5 rounded-xl border border-green-500 text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
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
  if (type === 'COLOR' && catalog.backgroundColor) return { backgroundColor: catalog.backgroundColor }
  if ((type === 'CUSTOM' || type === 'PREDEFINED') && catalog.backgroundImageUrl) {
    return { backgroundImage: `url(${catalog.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
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
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    setOpen(false)
  }
  function shareWhatsapp() {
    const msg = encodeURIComponent(`Mirá el catálogo "${catalogName}": ${url}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-colors bg-white shadow-md">
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

// Cart floating panel
function CartPanel({ cart, catalog, vendorWhatsapp, catalogId, onUpdateQty, onRemove, onClear }) {
  const [showModal, setShowModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const items = Object.values(cart)
  const total = items.reduce((sum, { product, qty }) => {
    const price = product.offerPrice ?? product.price ?? 0
    return sum + Number(price) * qty
  }, 0)

  function buildWhatsappMsg(name) {
    const lines = items.map(({ product, qty, variants }) => {
      const price = product.offerPrice ?? product.price
      const priceStr = price != null ? ` — $${Number(price).toLocaleString('es-AR')}` : ''
      const varStr = variants && Object.keys(variants).length > 0
        ? ` (${Object.entries(variants).map(([k, v]) => `${k}: ${v}`).join(', ')})`
        : ''
      return `• ${product.name}${varStr} × ${qty}${priceStr}`
    })
    const totalStr = total > 0 ? `\n\n💰 Total estimado: $${total.toLocaleString('es-AR')}` : ''
    const nameStr = name?.trim() ? `\n\nMi nombre: ${name.trim()}` : ''
    return encodeURIComponent(
      `¡Hola! Me interesa hacer el siguiente pedido del catálogo "${catalog.name}":\n\n${lines.join('\n')}${totalStr}${nameStr}`
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      customerName: customerName.trim() || null,
      customerPhone: customerPhone.trim() || null,
      items: items.map(({ product, qty, variants }) => ({
        productId: product.id,
        productName: product.name + (variants && Object.keys(variants).length > 0
          ? ` (${Object.entries(variants).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''),
        price: product.price,
        offerPrice: product.offerPrice,
        quantity: qty,
      })),
    }
    try {
      await publicApi.submitOrderRequest(catalogId, payload)
    } catch {
      // silently continue
    }
    const msg = buildWhatsappMsg(customerName)
    window.open(`https://wa.me/${vendorWhatsapp || ''}?text=${msg}`, '_blank')
    setDone(true)
    setShowModal(false)
    setTimeout(() => { onClear(); setDone(false) }, 2000)
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 print:hidden">
        <div className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Solicitud enviada
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 pb-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-600 shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{items.length}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {items.length === 1 ? '1 producto' : `${items.length} productos`} seleccionados
                </span>
                {total > 0 && (
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    — Total: ${total.toLocaleString('es-AR')}
                  </span>
                )}
              </div>
              <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                Vaciar
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mb-3 max-h-36 overflow-y-auto">
              {items.map(({ product, qty, variants }) => (
                <div key={product.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-gray-700 dark:text-slate-200 truncate">
                    {product.name}
                    {variants && Object.keys(variants).length > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({Object.entries(variants).map(([k, v]) => `${k}: ${v}`).join(', ')})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onUpdateQty(product.id, qty - 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors">
                      −
                    </button>
                    <span className="w-5 text-center text-xs font-medium text-gray-900 dark:text-white">{qty}</span>
                    <button onClick={() => onUpdateQty(product.id, qty + 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors">
                      +
                    </button>
                  </div>
                  {(() => {
                    const price = product.offerPrice ?? product.price
                    return price != null ? (
                      <span className="text-xs text-gray-500 dark:text-slate-400 w-20 text-right shrink-0">
                        ${(Number(price) * qty).toLocaleString('es-AR')}
                      </span>
                    ) : null
                  })()}
                  <button onClick={() => onRemove(product.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowModal(true)}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Solicitar por WhatsApp
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Confirmar solicitud</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Se enviará el pedido al vendedor por WhatsApp y recibirá una notificación.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1">Tu nombre <span className="text-gray-400">(opcional)</span></label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ej: María García"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <label className="block text-sm text-gray-600 dark:text-slate-400 mb-1 mt-3">Tu teléfono <span className="text-gray-400">(opcional)</span></label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 5491123456789"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-1.5">
                {items.map(({ product, qty, variants }) => {
                  const price = product.offerPrice ?? product.price
                  const varStr = variants && Object.keys(variants).length > 0
                    ? ` (${Object.entries(variants).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''
                  return (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-slate-200">{product.name}{varStr} × {qty}</span>
                      {price != null && (
                        <span className="text-gray-500 dark:text-slate-400">${(Number(price) * qty).toLocaleString('es-AR')}</span>
                      )}
                    </div>
                  )
                })}
                {total > 0 && (
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200 dark:border-slate-600">
                    <span className="text-gray-900 dark:text-white">Total estimado</span>
                    <span className="text-blue-600 dark:text-blue-400">${total.toLocaleString('es-AR')}</span>
                  </div>
                )}
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                {submitting ? 'Enviando...' : 'Enviar y abrir WhatsApp'}
              </button>
              <button type="button" onClick={() => setShowModal(false)}
                className="w-full py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default function PublicCatalogPage() {
  const { catalogId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { items, startIndex, productName }
  // cart: { [productId]: { product, qty, variants } }
  const [cart, setCart] = useState({})
  // variants selection per product: { [productId]: { VariantName: option } }
  const [variantSelections, setVariantSelections] = useState({})
  const viewedRef = useRef(false)

  useEffect(() => {
    publicApi.getCatalog(catalogId)
      .then(({ data: d }) => {
        if (d.available === false) {
          navigate(d.vendorSlug ? `/p/${d.vendorSlug}` : '/', {
            replace: true,
            state: { catalogNotFound: true, catalogName: d.catalog?.name }
          })
          return
        }
        setData(d)
        // SEO meta tags
        document.title = `${d.catalog.name} — ${d.vendorName}`
        setOrUpdateMeta('og:title', `${d.catalog.name} — ${d.vendorName}`)
        setOrUpdateMeta('og:description', d.catalog.description || d.catalog.aiContent || `Catálogo de ${d.vendorName}`)
        if (d.catalog.coverImageUrl) setOrUpdateMeta('og:image', d.catalog.coverImageUrl)
        setOrUpdateMeta('og:url', window.location.href)
        setOrUpdateMeta('og:type', 'website')
        if (!viewedRef.current) {
          viewedRef.current = true
          publicApi.trackCatalogView(d.catalog.id).catch(() => {})
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [catalogId])

  function setOrUpdateMeta(property, content) {
    if (!content) return
    let el = document.querySelector(`meta[property="${property}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('property', property)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  function addToCart(product) {
    const vs = variantSelections[product.id] || {}
    setCart(c => ({
      ...c,
      [product.id]: { product, qty: (c[product.id]?.qty || 0) + 1, variants: vs }
    }))
  }
  function removeFromCart(productId) {
    setCart(c => { const n = { ...c }; delete n[productId]; return n })
  }
  function updateQty(productId, qty) {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(c => ({ ...c, [productId]: { ...c[productId], qty } }))
  }
  function clearCart() { setCart({}) }

  const cartCount = Object.keys(cart).length

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

  const {
    catalog, vendorName, vendorSlug, vendorWhatsapp,
    vendorProfileImageUrl, vendorBannerImageUrl, vendorBio,
    vendorBrandColorPrimary,
  } = data
  const brandColor = vendorBrandColorPrimary || '#2563eb'
  const viewMode = catalog.viewMode || 'GRID'
  const bgStyle = resolveBackground(catalog)
  const hasBg = Object.keys(bgStyle).length > 0
  const pageUrl = window.location.href

  const allProducts = catalog.products || []
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]

  const visibleProducts = allProducts.filter(p => {
    const matchCat = !activeCategory || p.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

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

      <div className={`min-h-screen flex flex-col bg-gray-50 ${cartCount > 0 ? 'pb-52' : ''}`}>
        {/* Vendor profile header */}
        <header className="bg-white border-b border-gray-200 print:hidden">
          {/* Banner */}
          <div className="relative w-full h-36 sm:h-48 overflow-hidden"
            style={vendorBannerImageUrl
              ? { backgroundImage: `url(${vendorBannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { backgroundColor: brandColor + '22' }
            }>
            {!vendorBannerImageUrl && (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brandColor}33 0%, ${brandColor}11 100%)` }} />
            )}
            {/* Action buttons top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <ShareButton url={pageUrl} catalogName={catalog.name} />
              <button onClick={() => setShowQR(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-colors shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-colors shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2v-5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>

          {/* Profile info */}
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
              {/* Avatar */}
              <div className="shrink-0">
                {vendorProfileImageUrl ? (
                  <img src={vendorProfileImageUrl} alt={vendorName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: brandColor }}>
                    {vendorName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* WhatsApp button */}
              {vendorWhatsapp && (
                <a href={`https://wa.me/${vendorWhatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="mb-1 flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>

            {/* Name + bio + profile link */}
            <div className="pb-4">
              <h2 className="text-xl font-bold text-gray-900">{vendorName}</h2>
              {vendorBio && <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-xl">{vendorBio}</p>}
              {vendorSlug && (
                <Link to={`/p/${vendorSlug}`}
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
                  style={{ color: brandColor }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Ver perfil completo
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Catalog content */}
        <div className={`flex-1 catalog-bg ${hasBg ? 'relative' : ''}`} style={bgStyle}>
          {hasBg && <div className="absolute inset-0 bg-white/70 pointer-events-none" />}
          <div className="relative max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6 print:mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">{catalog.name}</h1>
              {catalog.description && <p className="hidden sm:block text-gray-600 text-base">{catalog.description}</p>}
              {catalog.aiContent && <p className="text-gray-500 text-sm italic mt-2 max-w-2xl leading-relaxed">{catalog.aiContent}</p>}
            </div>

            {/* Search + Category filter */}
            <div className="mb-6 print:hidden space-y-3">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:max-w-sm px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              />
              {categories.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setActiveCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeCategory === null ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    Todos ({allProducts.length})
                  </button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      {cat} ({allProducts.filter(p => p.category === cat).length})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Products */}
            {visibleProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                {search ? `Sin resultados para "${search}".` : 'Sin productos en este catálogo.'}
              </div>
            ) : viewMode === 'LIST' ? (
              <div className="flex flex-col gap-4">
                {visibleProducts.map(p => (
                  <ProductCardList key={p.id} product={p} catalogName={catalog.name} vendorWhatsapp={vendorWhatsapp}
                    inCart={!!cart[p.id]}
                    selectedVariants={variantSelections[p.id] || {}}
                    onVariantChange={vs => setVariantSelections(s => ({ ...s, [p.id]: vs }))}
                    onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)}
                    onOpenGallery={(items, idx) => setLightbox({ items, startIndex: idx, productName: p.name })}
                  />
                ))}
              </div>
            ) : viewMode === 'MOSAIC' ? (
              <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                {visibleProducts.map(p => (
                  <div key={p.id} className="break-inside-avoid">
                    <ProductCardGrid product={p} catalogName={catalog.name} vendorWhatsapp={vendorWhatsapp}
                      inCart={!!cart[p.id]}
                      selectedVariants={variantSelections[p.id] || {}}
                      onVariantChange={vs => setVariantSelections(s => ({ ...s, [p.id]: vs }))}
                      onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)}
                      onOpenGallery={(items, idx) => setLightbox({ items, startIndex: idx, productName: p.name })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visibleProducts.map(p => (
                  <ProductCardGrid key={p.id} product={p} catalogName={catalog.name} vendorWhatsapp={vendorWhatsapp}
                    inCart={!!cart[p.id]}
                    selectedVariants={variantSelections[p.id] || {}}
                    onVariantChange={vs => setVariantSelections(s => ({ ...s, [p.id]: vs }))}
                    onAdd={() => addToCart(p)} onRemove={() => removeFromCart(p.id)}
                    onOpenGallery={(items, idx) => setLightbox({ items, startIndex: idx, productName: p.name })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="py-5 text-center text-xs text-gray-400 border-t border-gray-200 bg-white print:hidden space-y-1">
          <p>
            Catálogo digital de{' '}
            {vendorSlug
              ? <Link to={`/p/${vendorSlug}`} className="font-medium text-gray-600 hover:underline">{vendorName}</Link>
              : <span className="font-medium text-gray-600">{vendorName}</span>
            }
          </p>
          <p>Desarrollado por <span className="font-medium text-gray-500">JAFPSoft</span> · © {new Date().getFullYear()} Todos los derechos reservados</p>
        </footer>
      </div>

      {cartCount > 0 && (
        <CartPanel
          cart={cart}
          catalog={catalog}
          vendorWhatsapp={vendorWhatsapp}
          catalogId={catalogId}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onClear={clearCart}
        />
      )}

      {showQR && <QRModal url={pageUrl} catalogName={catalog.name} onClose={() => setShowQR(false)} />}

      {lightbox && (
        <LightboxModal
          items={lightbox.items}
          startIndex={lightbox.startIndex}
          productName={lightbox.productName}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
