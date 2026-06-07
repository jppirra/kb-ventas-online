import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { publicStoreApi } from '../api/stores'
import Footer from '../components/Footer'

function resolveBackground(catalog) {
  const type = catalog.backgroundType || 'NONE'
  if (type === 'COLOR' && catalog.backgroundColor) return { backgroundColor: catalog.backgroundColor }
  if ((type === 'CUSTOM' || type === 'PREDEFINED') && catalog.backgroundImageUrl) {
    return { backgroundImage: `url(${catalog.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return {}
}

export default function StorePage() {
  const { storeSlug } = useParams()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    publicStoreApi.getStore(storeSlug)
      .then(r => setStore(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [storeSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-400 dark:text-slate-500 text-sm">Cargando...</p>
      </div>
    )
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-slate-400 text-lg font-medium mb-2">Local no encontrado</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm">La URL que visitaste no existe o no está disponible.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Store header */}
        <div className="mb-10 text-center">
          {store.logoUrl && (
            <img src={store.logoUrl} alt={store.name}
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow" />
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
          {store.description && (
            <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-lg mx-auto">{store.description}</p>
          )}
          {store.whatsappNumber && (
            <a
              href={`https://wa.me/${store.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Contactar
            </a>
          )}
        </div>

        {/* Catalogs grid */}
        {store.catalogs && store.catalogs.length > 0 ? (
          <>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Catálogos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {store.catalogs.map(catalog => {
                const bgStyle = resolveBackground(catalog)
                const hasBg = Object.keys(bgStyle).length > 0
                return (
                  <Link
                    key={catalog.id}
                    to={`/c/${catalog.id}`}
                    className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow"
                  >
                    <div
                      className="h-32 flex items-end p-4"
                      style={hasBg ? bgStyle : {}}
                    >
                      {!hasBg && catalog.coverImageUrl && (
                        <img src={catalog.coverImageUrl} alt={catalog.name}
                          className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className={`relative z-10 ${hasBg || catalog.coverImageUrl ? 'text-white drop-shadow' : 'text-gray-900 dark:text-white'}`}>
                        <h3 className="font-bold text-lg leading-tight">{catalog.name}</h3>
                        {catalog.description && (
                          <p className="text-sm opacity-80 mt-0.5 line-clamp-1">{catalog.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="px-4 py-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {catalog.products?.length ?? 0} productos
                      </span>
                      <span className="text-xs text-blue-500 group-hover:underline">Ver catálogo →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-slate-500 text-sm">Este local no tiene catálogos disponibles.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
