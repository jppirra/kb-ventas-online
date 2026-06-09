import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { productsApi } from '../api/products'
import { catalogsApi } from '../api/catalogs'

const emptyForm = {
  name: '', description: '', price: '', offerPrice: '', sku: '', category: '', imageUrl: '',
  showStock: false, stockStatus: 'IN_STOCK', stockCount: '', showStockQuantity: false,
  showWhenOutOfStock: false,
  extraImages: [], // array of URL strings
  videoUrl: '',
  variants: [], // array of {name, options: string[]}
}

const FILTER_ALL = 'all'
const FILTER_IN_CATALOG = 'in_catalog'
const FILTER_REPO_ONLY = 'repo_only'

// Variant builder component
function VariantBuilder({ variants, onChange }) {
  const [newOption, setNewOption] = useState({}) // {[variantIndex]: string}

  function addVariant() {
    onChange([...variants, { name: '', options: [] }])
  }

  function removeVariant(idx) {
    onChange(variants.filter((_, i) => i !== idx))
  }

  function updateVariantName(idx, name) {
    onChange(variants.map((v, i) => i === idx ? { ...v, name } : v))
  }

  function addOption(idx) {
    const opt = (newOption[idx] || '').trim()
    if (!opt) return
    onChange(variants.map((v, i) => i === idx ? { ...v, options: [...v.options, opt] } : v))
    setNewOption(s => ({ ...s, [idx]: '' }))
  }

  function removeOption(variantIdx, optIdx) {
    onChange(variants.map((v, i) => i === variantIdx
      ? { ...v, options: v.options.filter((_, oi) => oi !== optIdx) }
      : v))
  }

  return (
    <div className="space-y-3">
      {variants.map((v, idx) => (
        <div key={idx} className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={v.name}
              onChange={e => updateVariantName(idx, e.target.value)}
              placeholder="Ej: Talle, Color, Material..."
              className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={() => removeVariant(idx)}
              className="text-gray-400 hover:text-red-400 transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Options */}
          <div className="flex flex-wrap gap-1">
            {v.options.map((opt, oi) => (
              <span key={oi} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-lg">
                {opt}
                <button type="button" onClick={() => removeOption(idx, oi)} className="hover:text-red-400">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={newOption[idx] || ''}
              onChange={e => setNewOption(s => ({ ...s, [idx]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption(idx))}
              placeholder="Agregar opción y Enter"
              className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button type="button" onClick={() => addOption(idx)}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
              +
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addVariant}
        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Agregar tipo de variante
      </button>
    </div>
  )
}

export default function StockPage() {
  const navigate = useNavigate()
  const imgRef = useRef()
  const galleryImgRef = useRef()

  const [products, setProducts] = useState([])
  const [catalogs, setCatalogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(FILTER_ALL)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [pendingImgId, setPendingImgId] = useState(null)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningProduct, setAssigningProduct] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list(),
        catalogsApi.list(),
      ])
      setProducts(prodRes.data)
      setCatalogs(catRes.data)
    } catch {
      toast.error('Error al cargar el repositorio')
    } finally {
      setLoading(false)
    }
  }

  function parseExtraImages(json) {
    try { return JSON.parse(json) || [] } catch { return [] }
  }

  function parseVariants(json) {
    try { return JSON.parse(json) || [] } catch { return [] }
  }

  function openForm(product = null) {
    if (product) {
      setEditingId(product.id)
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        offerPrice: product.offerPrice ?? '',
        sku: product.sku || '',
        category: product.category || '',
        imageUrl: product.imageUrl || '',
        showStock: product.showStock || false,
        stockStatus: product.stockStatus || 'IN_STOCK',
        stockCount: product.stockCount ?? '',
        showStockQuantity: product.showStockQuantity || false,
        showWhenOutOfStock: product.showWhenOutOfStock || false,
        extraImages: parseExtraImages(product.extraImagesJson),
        videoUrl: product.videoUrl || '',
        variants: parseVariants(product.variantsJson),
      })
    } else {
      setEditingId(null)
      setForm(emptyForm)
    }
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      price: form.price !== '' ? parseFloat(form.price) : null,
      offerPrice: form.offerPrice !== '' ? parseFloat(form.offerPrice) : null,
      stockCount: form.stockCount !== '' ? parseInt(form.stockCount) : null,
      extraImagesJson: form.extraImages.length > 0 ? JSON.stringify(form.extraImages) : null,
      videoUrl: form.videoUrl.trim() || null,
      variantsJson: form.variants.length > 0 ? JSON.stringify(form.variants) : null,
    }
    try {
      if (editingId) {
        const { data } = await productsApi.update(editingId, payload)
        setProducts(ps => ps.map(p => p.id === editingId ? data : p))
        toast.success('Producto actualizado')
      } else {
        const { data } = await productsApi.create(payload)
        setProducts(ps => [data, ...ps])
        toast.success('Producto creado en el repositorio')
      }
      setShowForm(false)
    } catch {
      toast.error('Error al guardar producto')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto definitivamente?')) return
    try {
      await productsApi.remove(id)
      setProducts(ps => ps.filter(p => p.id !== id))
      toast.success('Producto eliminado')
    } catch {
      toast.error('Error al eliminar producto')
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImg(true)
    try {
      let url
      if (pendingImgId) {
        const { data } = await productsApi.uploadImage(pendingImgId, file)
        url = data.imageUrl
        setProducts(ps => ps.map(p => p.id === pendingImgId ? { ...p, imageUrl: url } : p))
      } else {
        const { data } = await productsApi.uploadTempImage(file)
        url = data.imageUrl
      }
      setForm(f => ({ ...f, imageUrl: url }))
      toast.success('Imagen subida')
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      setUploadingImg(false)
      setPendingImgId(null)
      e.target.value = ''
    }
  }

  async function handleGalleryImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingGallery(true)
    try {
      let url
      if (editingId) {
        const { data } = await productsApi.uploadGalleryImage(editingId, file)
        url = data.imageUrl
      } else {
        const { data } = await productsApi.uploadTempImage(file)
        url = data.imageUrl
      }
      setForm(f => ({ ...f, extraImages: [...f.extraImages, url] }))
      toast.success('Imagen agregada a la galería')
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      setUploadingGallery(false)
      e.target.value = ''
    }
  }

  function removeGalleryImage(idx) {
    setForm(f => ({ ...f, extraImages: f.extraImages.filter((_, i) => i !== idx) }))
  }

  async function handleAssign(catalogId) {
    if (!assigningProduct) return
    try {
      await catalogsApi.assignProduct(catalogId, assigningProduct.id)
      await loadAll()
      toast.success('Producto agregado al catálogo')
      setShowAssignModal(false)
      setAssigningProduct(null)
    } catch {
      toast.error('Error al asignar producto')
    }
  }

  async function handleUnlink(product) {
    try {
      await catalogsApi.unlinkProduct(product.catalogId, product.id)
      await loadAll()
      toast.success('Producto movido al repositorio')
    } catch {
      toast.error('Error al desasignar producto')
    }
  }

  const filtered = products.filter(p => {
    const matchesFilter =
      filter === FILTER_ALL ||
      (filter === FILTER_IN_CATALOG && p.catalogId != null) ||
      (filter === FILTER_REPO_ONLY && p.catalogId == null)
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const inCatalogCount = products.filter(p => p.catalogId != null).length
  const repoOnlyCount = products.filter(p => p.catalogId == null).length

  if (loading) {
    return <Layout><div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div></Layout>
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {products.length} productos — {inCatalogCount} en catálogos, {repoOnlyCount} sin asignar
            </p>
          </div>
          <button onClick={() => openForm()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
            + Nuevo producto
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            {[
              { key: FILTER_ALL, label: `Todos (${products.length})` },
              { key: FILTER_IN_CATALOG, label: `En catálogo (${inCatalogCount})` },
              { key: FILTER_REPO_ONLY, label: `Sin asignar (${repoOnlyCount})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === f.key
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product form */}
        {showForm && (
          <form onSubmit={handleSave} className="mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {editingId ? 'Editar producto' : 'Nuevo producto en repositorio'}
            </h3>

            {/* Main image */}
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                <div className="relative group shrink-0">
                  <img src={form.imageUrl} alt="img" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-600" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <button type="button" disabled={uploadingImg}
                onClick={() => { setPendingImgId(editingId); imgRef.current.click() }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-medium rounded-xl transition-colors disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploadingImg ? 'Subiendo...' : 'Subir imagen principal'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Descripcion</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Precio</label>
                <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Precio oferta <span className="text-gray-400">(opcional)</span></label>
                <input type="number" step="0.01" value={form.offerPrice} onChange={e => setForm(f => ({ ...f, offerPrice: e.target.value }))}
                  placeholder="Precio con descuento"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">SKU</label>
                <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Categoria</label>
                <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Gallery images */}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Galería de imágenes</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.extraImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-600" />
                    <button type="button" onClick={() => removeGalleryImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" disabled={uploadingGallery}
                  onClick={() => galleryImgRef.current.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-50">
                  {uploadingGallery ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs mt-0.5">Foto</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500">Las imágenes de galería se pueden navegar con flechas en el catálogo público.</p>
            </div>

            {/* Video URL */}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Video</label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                placeholder="URL de YouTube o video directo (.mp4)"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">El video aparecerá como el último ítem en la galería.</p>
            </div>

            {/* Variants */}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Variantes</p>
              <VariantBuilder
                variants={form.variants}
                onChange={variants => setForm(f => ({ ...f, variants }))}
              />
            </div>

            {/* Stock */}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" id="showStockRepo" checked={form.showStock}
                  onChange={e => setForm(f => ({ ...f, showStock: e.target.checked }))} className="rounded" />
                <label htmlFor="showStockRepo" className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                  Mostrar disponibilidad de stock
                </label>
              </div>
              {form.showStock && (
                <div className="ml-6 space-y-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm(f => ({ ...f, stockStatus: 'IN_STOCK' }))}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${form.stockStatus === 'IN_STOCK' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                      En stock
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, stockStatus: 'ON_DEMAND' }))}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${form.stockStatus === 'ON_DEMAND' ? 'bg-yellow-500 border-yellow-500 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                      A pedido
                    </button>
                  </div>
                  {form.stockStatus === 'IN_STOCK' && (
                    <>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="showQtyRepo" checked={form.showStockQuantity}
                          onChange={e => setForm(f => ({ ...f, showStockQuantity: e.target.checked }))} className="rounded" />
                        <label htmlFor="showQtyRepo" className="text-sm text-gray-600 dark:text-slate-400">Mostrar cantidad</label>
                        {form.showStockQuantity && (
                          <input type="number" min="0" value={form.stockCount}
                            onChange={e => setForm(f => ({ ...f, stockCount: e.target.value }))}
                            placeholder="0"
                            className="ml-2 w-20 px-2 py-1 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="showWhenOutOfStockRepo" checked={form.showWhenOutOfStock}
                          onChange={e => setForm(f => ({ ...f, showWhenOutOfStock: e.target.checked }))} className="rounded" />
                        <label htmlFor="showWhenOutOfStockRepo" className="text-sm text-gray-600 dark:text-slate-400">Mostrar en catálogo sin stock</label>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <input ref={galleryImgRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryImageUpload} />

        {/* Products list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-400 dark:text-slate-500 text-sm">
              {products.length === 0 ? 'Sin productos. Crea el primero.' : 'No hay productos con este filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(product => {
              const hasGallery = product.extraImagesJson && parseExtraImages(product.extraImagesJson).length > 0
              const hasVideo = !!product.videoUrl
              const hasVariants = product.variantsJson && parseVariants(product.variantsJson).length > 0
              return (
                <div key={product.id} className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 ${!product.active && product.catalogId ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-slate-700" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                        {product.category && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
                            {product.category}
                          </span>
                        )}
                        {product.offerPrice != null ? (
                          <span className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">${Number(product.offerPrice).toLocaleString('es-AR')}</span>
                            {product.price != null && <span className="text-xs text-gray-400 line-through">${Number(product.price).toLocaleString('es-AR')}</span>}
                          </span>
                        ) : product.price != null && (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            ${Number(product.price).toLocaleString('es-AR')}
                          </span>
                        )}
                        {hasGallery && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            +{parseExtraImages(product.extraImagesJson).length}
                          </span>
                        )}
                        {hasVideo && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">video</span>
                        )}
                        {hasVariants && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full">variantes</span>
                        )}
                        {product.showStock && product.stockStatus && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            product.stockStatus === 'IN_STOCK'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {product.stockStatus === 'IN_STOCK' ? 'En stock' : 'A pedido'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {product.catalogId ? (
                          <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <button onClick={() => navigate(`/catalogs/${product.catalogId}`)} className="hover:text-blue-500 transition-colors">
                              {product.catalogName || 'Catálogo'}
                            </button>
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500 dark:text-amber-400">Sin catálogo</span>
                        )}
                        {product.catalogId && !product.active && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">Oculto</span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 truncate">{product.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-auto shrink-0">
                      {product.catalogId == null && (
                        <button
                          title="Agregar a catálogo"
                          onClick={() => { setAssigningProduct(product); setShowAssignModal(true) }}
                          className="p-1.5 text-gray-400 hover:text-green-500 dark:text-slate-500 dark:hover:text-green-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                      {product.catalogId != null && (
                        <button
                          title="Quitar del catálogo (vuelve al repositorio)"
                          onClick={() => handleUnlink(product)}
                          className="p-1.5 text-gray-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                      )}
                      <button onClick={() => openForm(product)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assign to catalog modal */}
      {showAssignModal && assigningProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Agregar a catálogo</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">"{assigningProduct.name}"</p>
            {catalogs.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">No tienes catálogos creados.</p>
            ) : (
              <div className="space-y-2">
                {catalogs.map(cat => (
                  <button key={cat.id} onClick={() => handleAssign(cat.id)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{cat.description}</p>}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
