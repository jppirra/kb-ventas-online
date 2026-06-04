import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { catalogsApi } from '../api/catalogs'

export default function CatalogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', sku: '', category: '' })
  const [editingProductId, setEditingProductId] = useState(null)
  const [pollTimer, setPollTimer] = useState(null)

  useEffect(() => {
    load()
    return () => clearInterval(pollTimer)
  }, [id])

  async function load() {
    try {
      const { data } = await catalogsApi.get(id)
      setCatalog(data)
      if (data.status === 'GENERATING') startPolling()
    } catch {
      toast.error('Catálogo no encontrado')
      navigate('/catalogs')
    } finally {
      setLoading(false)
    }
  }

  function startPolling() {
    setGenerating(true)
    const t = setInterval(async () => {
      try {
        const { data } = await catalogsApi.get(id)
        setCatalog(data)
        if (data.status !== 'GENERATING') {
          clearInterval(t)
          setGenerating(false)
          if (data.status === 'GENERATED') toast.success('Contenido IA generado')
        }
      } catch {
        clearInterval(t)
        setGenerating(false)
      }
    }, 3000)
    setPollTimer(t)
  }

  async function handleGenerate() {
    try {
      await catalogsApi.generate(id)
      setCatalog(c => ({ ...c, status: 'GENERATING' }))
      startPolling()
    } catch {
      toast.error('Error al iniciar generación IA')
    }
  }

  async function handleExcel(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingExcel(true)
    try {
      const { data } = await catalogsApi.uploadExcel(id, file)
      toast.success(`${data.imported} productos importados`)
      load()
    } catch {
      toast.error('Error al importar Excel')
    } finally {
      setUploadingExcel(false)
      e.target.value = ''
    }
  }

  function openProductForm(product = null) {
    if (product) {
      setEditingProductId(product.id)
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        sku: product.sku || '',
        category: product.category || '',
      })
    } else {
      setEditingProductId(null)
      setProductForm({ name: '', description: '', price: '', sku: '', category: '' })
    }
    setShowProductForm(true)
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    if (!productForm.name.trim()) return
    setSavingProduct(true)
    const payload = {
      ...productForm,
      price: productForm.price !== '' ? parseFloat(productForm.price) : null,
    }
    try {
      if (editingProductId) {
        await catalogsApi.updateProduct(id, editingProductId, payload)
        toast.success('Producto actualizado')
      } else {
        await catalogsApi.addProduct(id, payload)
        toast.success('Producto agregado')
      }
      setShowProductForm(false)
      load()
    } catch {
      toast.error('Error al guardar producto')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleDeleteProduct(productId) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await catalogsApi.deleteProduct(id, productId)
      setCatalog(c => ({ ...c, products: c.products.filter(p => p.id !== productId) }))
      toast.success('Producto eliminado')
    } catch {
      toast.error('Error al eliminar producto')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/catalogs')}
              className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 mb-2 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Catálogos
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{catalog.name}</h1>
            {catalog.description && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{catalog.description}</p>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || catalog.products?.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generando IA...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar con IA
              </>
            )}
          </button>
        </div>

        {/* AI Content */}
        {catalog.aiContent && (
          <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-2xl p-5">
            <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wide mb-2">Introduccion generada por IA</p>
            <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{catalog.aiContent}</p>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => openProductForm()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            + Agregar producto
          </button>
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploadingExcel}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {uploadingExcel ? 'Importando...' : 'Importar Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
          <span className="text-sm text-gray-400 dark:text-slate-500 ml-auto">
            {catalog.products?.length ?? 0} productos
          </span>
        </div>

        {/* Product form */}
        {showProductForm && (
          <form onSubmit={handleSaveProduct} className="mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {editingProductId ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Nombre *</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Descripcion</label>
                <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={2} resize="none"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Precio</label>
                <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">SKU</label>
                <input type="text" value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Categoria</label>
                <input type="text" value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingProduct}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {savingProduct ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowProductForm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Products list */}
        {catalog.products?.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 text-sm">Sin productos. Agregá uno manualmente o importá un Excel.</p>
            <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">Columnas Excel: nombre, descripcion, precio, sku, categoria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {catalog.products.map(product => (
              <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                      {product.category && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
                          {product.category}
                        </span>
                      )}
                      {product.price != null && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          ${Number(product.price).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{product.description}</p>
                    )}
                    {product.aiDescription && (
                      <div className="mt-2 pl-3 border-l-2 border-violet-400 dark:border-violet-500">
                        <p className="text-xs text-violet-500 dark:text-violet-400 font-medium mb-0.5">IA</p>
                        <p className="text-sm text-gray-600 dark:text-slate-300 italic">{product.aiDescription}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button onClick={() => openProductForm(product)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
