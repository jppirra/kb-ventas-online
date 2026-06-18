import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import { catalogsApi } from '../api/catalogs'
import { publicApi } from '../api/profile'
import ImageModal from '../components/ImageModal'
import { uploadCompressed } from '../utils/directUpload'
import api from '../api/axios'

const VIEW_MODES = [
  { value: 'GRID', label: 'Grilla', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { value: 'MOSAIC', label: 'Mosaico', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
    </svg>
  )},
  { value: 'LIST', label: 'Lista', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )},
]

const BG_TYPES = [
  { value: 'NONE', label: 'Sin fondo' },
  { value: 'COLOR', label: 'Color solido' },
  { value: 'PREDEFINED', label: 'Prediseñado' },
  { value: 'CUSTOM', label: 'Imagen propia' },
]

import { productsApi } from '../api/products'
import { RUBROS, getRubro } from '../config/rubros'

const emptyProduct = { name: '', description: '', price: '', sku: '', categories: [], imageUrl: '', extraImages: [], videoUrl: '', showStock: false, stockStatus: 'IN_STOCK', stockCount: '', showStockQuantity: false, productSizes: [], productColors: {}, stockMatrix: {} }

function SizeColorEditor({ sizes, sizeColorMap, onChange }) {
  if (sizes.length === 0) return (
    <p className="text-xs text-gray-400 dark:text-slate-500 italic">Agregá talles primero para definir los colores por talle.</p>
  )
  return (
    <div className="space-y-2">
      {sizes.map(size => (
        <div key={size} className="flex items-start gap-2">
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1.5 rounded-lg min-w-[2.5rem] text-center shrink-0 mt-0.5">{size}</span>
          <CsvInput
            label=""
            values={sizeColorMap[size] || []}
            onChange={colors => onChange({ ...sizeColorMap, [size]: colors })}
            placeholder="Rojo, Azul, Negro"
            hint={`Colores disponibles para talle ${size}. Separados por coma.`}
          />
        </div>
      ))}
    </div>
  )
}

function StockMatrixInput({ sizes, sizeColorMap, flatColors, matrix, onChange, atributoLabel }) {
  const hasSizes = sizes.length > 0
  const hasSCM = sizeColorMap && Object.keys(sizeColorMap).length > 0

  function getKey(size, color) {
    if (!hasSizes && !hasSCM) return color
    if (!color) return size
    return `${size}|${color}`
  }
  function getVal(size, color) {
    const v = matrix[getKey(size, color)]
    return v != null ? v : ''
  }
  function setVal(size, color, val) {
    const key = getKey(size, color)
    const qty = val === '' ? null : parseInt(val) || 0
    const next = { ...matrix }
    if (!qty) delete next[key]; else next[key] = qty
    onChange(next)
  }

  if (hasSizes && hasSCM) {
    return (
      <div className="space-y-3">
        {sizes.map(size => {
          const colors = sizeColorMap[size] || []
          return (
            <div key={size}>
              <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                {atributoLabel || 'Talle'} <span className="text-indigo-600 dark:text-indigo-400">{size}</span>
              </p>
              {colors.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 italic ml-2">Sin colores definidos para este talle.</p>
              ) : (
                <div className="flex flex-wrap gap-2 ml-2">
                  {colors.map(color => (
                    <div key={color} className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">{color}</span>
                      <input type="number" min="0" value={getVal(size, color)}
                        onChange={e => setVal(size, color, e.target.value)}
                        placeholder="0"
                        className="w-14 text-center px-1.5 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (hasSizes) {
    return (
      <div className="flex flex-wrap gap-2">
        {sizes.map(size => (
          <div key={size} className="flex items-center gap-1.5">
            <span className="text-xs text-gray-600 dark:text-slate-300">{size}</span>
            <input type="number" min="0" value={getVal(size, null)}
              onChange={e => setVal(size, null, e.target.value)} placeholder="0"
              className="w-14 text-center px-1.5 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {flatColors.map(color => (
        <div key={color} className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600 dark:text-slate-300">{color}</span>
          <input type="number" min="0" value={getVal(null, color)}
            onChange={e => setVal(null, color, e.target.value)} placeholder="0"
            className="w-14 text-center px-1.5 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          />
        </div>
      ))}
    </div>
  )
}

function CsvInput({ label, values, onChange, placeholder, hint }) {
  const [text, setText] = useState(() => values.join(', '))
  useEffect(() => { setText(values.join(', ')) }, [values.join(',')])
  function commit() {
    const arr = text.split(',').map(v => v.trim()).filter(Boolean)
    onChange(arr)
    setText(arr.join(', '))
  }
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs text-gray-500 dark:text-slate-400">{label}</label>
        <span className="group relative cursor-help">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-800 dark:bg-slate-700 text-white text-xs rounded-lg px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed shadow-lg">
            {hint}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-slate-700" />
          </span>
        </span>
      </div>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default function CatalogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()
  const bgFileRef = useRef()
  const productImgRef = useRef()
  const extraImgRef = useRef()

  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [editingProductId, setEditingProductId] = useState(null)
  const [uploadingProductImg, setUploadingProductImg] = useState(false)
  const [uploadingExtraImg, setUploadingExtraImg] = useState(false)
  const [pendingProductImgId, setPendingProductImgId] = useState(null)
  const [pollTimer, setPollTimer] = useState(null)
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [repoProducts, setRepoProducts] = useState([])
  const [loadingRepo, setLoadingRepo] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Appearance state (synced on load, saved separately)
  const [viewMode, setViewMode] = useState('GRID')
  const [bgType, setBgType] = useState('NONE')
  const [bgColor, setBgColor] = useState('#f8fafc')
  const [bgTemplateId, setBgTemplateId] = useState(null)
  const [bgTemplates, setBgTemplates] = useState([])
  const [bgModalIdx, setBgModalIdx] = useState(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [bgProgress, setBgProgress] = useState(null)
  const [savingAppearance, setSavingAppearance] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    load()
    publicApi.getBackgrounds().then(({ data }) => setBgTemplates(data)).catch(() => {})
    return () => clearInterval(pollTimer)
  }, [id])

  async function load() {
    try {
      const { data } = await catalogsApi.get(id)
      setCatalog(data)
      setViewMode(data.viewMode || 'GRID')
      setBgType(data.backgroundType || 'NONE')
      setBgColor(data.backgroundColor || '#f8fafc')
      setBgTemplateId(data.backgroundTemplateId || null)
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

  async function handlePublish() {
    setPublishing(true)
    try {
      const { data } = await catalogsApi.publish(id)
      setCatalog(c => ({ ...c, publishedAt: data.publishedAt, hasDraftChanges: false }))
      toast.success('Catálogo publicado')
    } catch {
      toast.error('Error al publicar')
    } finally {
      setPublishing(false)
    }
  }

  function publishStatus() {
    if (!catalog.publishedAt) return { label: 'Sin publicar', color: 'gray' }
    if (catalog.hasDraftChanges) return { label: 'Cambios sin publicar', color: 'amber' }
    return { label: 'Publicado', color: 'green' }
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
      let extraImages = []
      try { extraImages = product.extraImagesJson ? JSON.parse(product.extraImagesJson) : [] } catch {}
      let productSizes = []
      let productColors = {}
      let stockMatrix = {}
      try { productSizes = product.productSizes ? JSON.parse(product.productSizes) : [] } catch {}
      try {
        const pc = product.productColors ? JSON.parse(product.productColors) : null
        if (pc && !Array.isArray(pc)) productColors = pc  // per-size map
        // legacy flat array: ignore (treated as empty map, user re-enters per-size)
      } catch {}
      try { stockMatrix = product.stockMatrix ? JSON.parse(product.stockMatrix) : {} } catch {}
      const categories = product.category
        ? product.category.split(',').map(c => c.trim()).filter(Boolean)
        : []
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        sku: product.sku || '',
        categories,
        imageUrl: product.imageUrl || '',
        extraImages,
        videoUrl: product.videoUrl || '',
        showStock: product.showStock || false,
        stockStatus: product.stockStatus || 'IN_STOCK',
        stockCount: product.stockCount ?? '',
        showStockQuantity: product.showStockQuantity || false,
        productSizes,
        productColors,
        stockMatrix,
      })
    } else {
      setEditingProductId(null)
      setProductForm(emptyProduct)
    }
    setShowProductForm(true)
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    if (!productForm.name.trim()) return
    setSavingProduct(true)
    const hasMatrix = Object.keys(productForm.stockMatrix).length > 0
    const payload = {
      ...productForm,
      category: productForm.categories.length > 0 ? productForm.categories.join(', ') : null,
      price: productForm.price !== '' ? parseFloat(productForm.price) : null,
      stockCount: !hasMatrix && productForm.stockCount !== '' ? parseInt(productForm.stockCount) : null,
      extraImagesJson: productForm.extraImages.length > 0 ? JSON.stringify(productForm.extraImages) : null,
      videoUrl: productForm.videoUrl || null,
      productSizes: productForm.productSizes.length > 0 ? JSON.stringify(productForm.productSizes) : null,
      productColors: Object.keys(productForm.productColors).length > 0 ? JSON.stringify(productForm.productColors) : null,
      stockMatrix: hasMatrix ? JSON.stringify(productForm.stockMatrix) : null,
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
    if (!confirm('¿Eliminar este producto definitivamente?')) return
    try {
      await catalogsApi.deleteProduct(id, productId)
      setCatalog(c => ({ ...c, products: c.products.filter(p => p.id !== productId) }))
      toast.success('Producto eliminado')
    } catch {
      toast.error('Error al eliminar producto')
    }
  }

  async function handleToggleActive(productId) {
    try {
      const { data } = await catalogsApi.toggleProductActive(id, productId)
      setCatalog(c => ({ ...c, products: c.products.map(p => p.id === productId ? { ...p, active: data.active } : p) }))
      toast.success(data.active ? 'Producto visible en el catálogo' : 'Producto oculto (queda en repositorio)')
    } catch {
      toast.error('Error al cambiar visibilidad')
    }
  }

  async function handleUnlinkProduct(productId) {
    try {
      await catalogsApi.unlinkProduct(id, productId)
      setCatalog(c => ({ ...c, products: c.products.filter(p => p.id !== productId) }))
      toast.success('Producto movido al repositorio')
    } catch {
      toast.error('Error al mover al repositorio')
    }
  }

  async function openRepoModal() {
    setShowRepoModal(true)
    setLoadingRepo(true)
    try {
      const { data } = await productsApi.list()
      const catalogProductIds = new Set(catalog.products.map(p => p.id))
      setRepoProducts(data.filter(p => p.catalogId == null || !catalogProductIds.has(p.id)))
    } catch {
      toast.error('Error al cargar el repositorio')
    } finally {
      setLoadingRepo(false)
    }
  }

  async function handleAssignFromRepo(productId) {
    try {
      await catalogsApi.assignProduct(id, productId)
      setShowRepoModal(false)
      load()
      toast.success('Producto agregado al catálogo')
    } catch {
      toast.error('Error al agregar producto')
    }
  }

  async function handleProductImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingProductImg(true)
    try {
      const { data } = await catalogsApi.uploadTempProductImage(id, file)
      setProductForm(f => ({ ...f, imageUrl: data.imageUrl }))
      toast.success('Imagen subida')
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      setUploadingProductImg(false)
      e.target.value = ''
    }
  }

  async function handleExtraImageUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''
    setUploadingExtraImg(true)
    let added = 0
    for (const file of files) {
      try {
        const { data } = await catalogsApi.uploadTempProductImage(id, file)
        setProductForm(f => ({ ...f, extraImages: [...f.extraImages, data.imageUrl] }))
        added++
      } catch {
        toast.error(`Error al subir ${file.name}`)
      }
    }
    if (added > 0) toast.success(`${added} imagen${added > 1 ? 'es' : ''} agregada${added > 1 ? 's' : ''}`)
    setUploadingExtraImg(false)
  }

  function triggerProductImageUpload() {
    productImgRef.current.click()
  }

  async function handleBgImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingBg(true)
    setBgProgress(0)
    try {
      const { data } = await uploadCompressed(file, (compressed, onPct) => {
        const fd = new FormData()
        fd.append('file', compressed)
        return api.post(`/catalogs/${id}/upload-background`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => e.total && onPct(Math.round(e.loaded / e.total * 100))
        })
      }, setBgProgress)
      setCatalog(c => ({ ...c, backgroundImageUrl: data.backgroundImageUrl, backgroundType: 'CUSTOM' }))
      setBgType('CUSTOM')
      toast.success('Fondo subido')
    } catch {
      toast.error('Error al subir fondo')
    } finally {
      setUploadingBg(false)
      setBgProgress(null)
      e.target.value = ''
    }
  }

  async function handleSaveAppearance() {
    setSavingAppearance(true)
    try {
      const payload = {
        name: catalog.name,
        description: catalog.description,
        viewMode,
        backgroundType: bgType,
        backgroundColor: bgType === 'COLOR' ? bgColor : null,
        backgroundTemplateId: bgType === 'PREDEFINED' ? bgTemplateId : null,
        backgroundImageUrl: bgType === 'CUSTOM' ? catalog.backgroundImageUrl : null,
      }
      const { data } = await catalogsApi.update(id, payload)
      setCatalog(c => ({ ...c, ...data, products: data.products ?? c.products }))
      toast.success('Apariencia guardada')
    } catch {
      toast.error('Error al guardar apariencia')
    } finally {
      setSavingAppearance(false)
    }
  }

  function handleCopyLink() {
    const link = `${window.location.origin}/c/${catalog.publicId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div>
      </Layout>
    )
  }

  const publicLink = `${window.location.origin}/c/${catalog.publicId}`

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => navigate('/catalogs')}
              className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 mb-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Catálogos
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{catalog.name}</h1>
              {catalog.rubro && getRubro(catalog.rubro) && (
                <span className="text-sm px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {getRubro(catalog.rubro).label}
                </span>
              )}
            </div>
            {catalog.description && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{catalog.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(() => {
              const ps = publishStatus()
              const colors = {
                gray: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
                amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
              }
              return (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[ps.color]}`}>
                  {ps.label}
                </span>
              )
            })()}
            <button onClick={handlePublish} disabled={publishing || catalog.products?.length === 0 || (!catalog.hasDraftChanges && catalog.publishedAt)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">
              {publishing ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Publicando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {catalog.publishedAt ? 'Republicar' : 'Publicar'}
                </>
              )}
            </button>
            <button onClick={handleGenerate} disabled={generating || catalog.products?.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
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
        </div>

        {/* Share link */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-2">Enlace público del catálogo</p>
          <div className="flex items-center gap-2 flex-wrap">
            <a href={publicLink} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate flex-1 min-w-0">{publicLink}</a>
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors shrink-0">
              {copiedLink ? (
                <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copiado</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copiar</>
              )}
            </button>
          </div>
          {catalog.hasDraftChanges && catalog.publishedAt ? (
            <p className="text-xs text-amber-500 dark:text-amber-400 mt-1.5">Hay cambios sin publicar. El enlace público muestra la última versión publicada hasta que vuelvas a publicar.</p>
          ) : !catalog.publishedAt ? (
            <p className="text-xs text-amber-500 dark:text-amber-400 mt-1.5">Este catálogo aún no fue publicado. Publicá para confirmar que el contenido es el correcto.</p>
          ) : (
            <p className="text-xs text-blue-400 dark:text-blue-500 mt-1.5">Este link es público. Quien lo tenga puede ver el catálogo y exportarlo a PDF.</p>
          )}
        </div>

        {/* AI Content */}
        {catalog.aiContent && (
          <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-2xl p-5">
            <p className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wide mb-2">Introducción generada por IA</p>
            <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{catalog.aiContent}</p>
          </div>
        )}

        {/* ── Appearance section ─────────────────────────────────────────────── */}
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Apariencia del catálogo</h2>

          {/* View mode */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Layout de productos</p>
            <div className="flex gap-2 flex-wrap">
              {VIEW_MODES.map(m => (
                <button key={m.value} onClick={() => setViewMode(m.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    viewMode === m.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background type */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Fondo</p>
            <div className="flex gap-2 flex-wrap">
              {BG_TYPES.map(t => (
                <button key={t.value} onClick={() => setBgType(t.value)}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                    bgType === t.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          {bgType === 'COLOR' && (
            <div className="mb-4 flex items-center gap-3">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-gray-300 dark:border-slate-600 cursor-pointer" />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white w-32 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {/* Predefined templates */}
          {bgType === 'PREDEFINED' && (
            <div className="mb-4">
              {bgModalIdx !== null && bgTemplates[bgModalIdx]?.imageUrl && (
                <ImageModal
                  src={bgTemplates[bgModalIdx].imageUrl}
                  alt={bgTemplates[bgModalIdx].name}
                  onClose={() => setBgModalIdx(null)}
                  prev={bgModalIdx > 0 ? () => setBgModalIdx(bgModalIdx - 1) : null}
                  next={bgModalIdx < bgTemplates.length - 1 ? () => setBgModalIdx(bgModalIdx + 1) : null}
                >
                  <button
                    onClick={() => { setBgTemplateId(bgTemplates[bgModalIdx].id); setBgModalIdx(null) }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
                  >
                    Seleccionar este fondo
                  </button>
                </ImageModal>
              )}
              {bgTemplates.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 italic">No hay fondos prediseñados disponibles todavía.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {bgTemplates.map((t, idx) => (
                    <div key={t.id} className="relative group">
                      <button onClick={() => setBgTemplateId(t.id)}
                        className={`relative aspect-video w-full rounded-xl overflow-hidden border-2 transition-all ${
                          bgTemplateId === t.id ? 'border-blue-600 ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'
                        }`}>
                        {t.imageUrl ? (
                          <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-slate-700" />
                        )}
                        {bgTemplateId === t.id && (
                          <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/40 px-1 py-0.5">
                          <p className="text-white text-[9px] truncate">{t.name}</p>
                        </div>
                      </button>
                      {t.imageUrl && (
                        <button
                          onClick={() => setBgModalIdx(idx)}
                          className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-black/70 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ver en grande"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom image upload */}
          {bgType === 'CUSTOM' && (
            <div className="mb-4 flex items-center gap-3">
              {catalog.backgroundImageUrl && (
                <img src={catalog.backgroundImageUrl} alt="Fondo" className="w-20 h-12 rounded-xl object-cover border border-gray-200 dark:border-slate-600" />
              )}
              <button onClick={() => bgFileRef.current.click()} disabled={uploadingBg}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 min-w-[160px]">
                {uploadingBg ? (
                  <span className="flex items-center gap-2 w-full">
                    <span className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                      <span className="block bg-blue-500 h-1.5 rounded-full transition-all duration-200" style={{ width: `${bgProgress ?? 0}%` }} />
                    </span>
                    <span className="text-xs tabular-nums">{bgProgress ?? 0}%</span>
                  </span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Subir imagen de fondo
                  </>
                )}
              </button>
              <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
            </div>
          )}

          <button onClick={handleSaveAppearance} disabled={savingAppearance}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
            {savingAppearance ? 'Guardando...' : 'Guardar apariencia'}
          </button>
        </div>

        {/* ── Products section ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button onClick={() => openProductForm()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
            + Nuevo producto
          </button>
          <button onClick={openRepoModal}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Desde repositorio
          </button>
          <button onClick={() => fileRef.current.click()} disabled={uploadingExcel}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
            {uploadingExcel ? 'Importando...' : 'Importar Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
          <input ref={productImgRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
          <input ref={extraImgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleExtraImageUpload} />
          <span className="text-sm text-gray-400 dark:text-slate-500 ml-auto">
            {catalog.products?.length ?? 0} productos ({catalog.products?.filter(p => p.active).length ?? 0} visibles)
          </span>
        </div>

        {/* Product form */}
        {showProductForm && (
          <form onSubmit={handleSaveProduct} className="mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {editingProductId ? 'Editar producto' : 'Nuevo producto'}
            </h3>

            {/* Images & video */}
            <div className="space-y-3">
              {/* Main image */}
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Imagen principal</p>
                <div className="flex items-center gap-3">
                  {productForm.imageUrl ? (
                    <img src={productForm.imageUrl} alt="img" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-600 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <button type="button" disabled={uploadingProductImg} onClick={triggerProductImageUpload}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-medium rounded-xl transition-colors disabled:opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {uploadingProductImg ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    {productForm.imageUrl && (
                      <button type="button" onClick={() => setProductForm(f => ({ ...f, imageUrl: '' }))}
                        className="text-xs text-red-400 hover:text-red-600 text-left">
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra images */}
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Imágenes adicionales</p>
                <div className="flex flex-wrap gap-2">
                  {productForm.extraImages.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-slate-600" />
                      <button type="button" onClick={() => setProductForm(f => ({ ...f, extraImages: f.extraImages.filter((_, j) => j !== i) }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" disabled={uploadingExtraImg} onClick={() => extraImgRef.current.click()}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-50">
                    {uploadingExtraImg ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Video (URL de YouTube, Vimeo, etc.)</label>
                <input type="url" value={productForm.videoUrl} onChange={e => setProductForm(f => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Nombre *</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Descripcion</label>
                <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={2}
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
                <CsvInput
                  label="Categorías"
                  values={productForm.categories}
                  onChange={v => setProductForm(f => ({ ...f, categories: v }))}
                  placeholder="Ej: abrigo, campera"
                  hint="Ingresá una o más categorías separadas por coma. Ej: abrigo, campera. Cada valor será una categoría independiente para filtrar."
                />
              </div>
            </div>

            {/* Stock section */}
            {(() => {
              const rubroInfo = catalog.rubro ? getRubro(catalog.rubro) : null
              const hasSizes = productForm.productSizes.length > 0
              const hasColorMap = !Array.isArray(productForm.productColors) && Object.keys(productForm.productColors).length > 0
              const hasColors = Array.isArray(productForm.productColors) && productForm.productColors.length > 0
              const useMatrix = productForm.showStock && productForm.stockStatus === 'IN_STOCK' && (hasSizes || hasColors || hasColorMap)
              return (
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="showStock" checked={productForm.showStock}
                      onChange={e => setProductForm(f => ({ ...f, showStock: e.target.checked }))} className="rounded" />
                    <label htmlFor="showStock" className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                      Registrar stock
                    </label>
                  </div>
                  {productForm.showStock && (
                    <div className="ml-6 space-y-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setProductForm(f => ({ ...f, stockStatus: 'IN_STOCK' }))}
                          className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${productForm.stockStatus === 'IN_STOCK' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                          En stock
                        </button>
                        <button type="button" onClick={() => setProductForm(f => ({ ...f, stockStatus: 'ON_DEMAND' }))}
                          className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${productForm.stockStatus === 'ON_DEMAND' ? 'bg-yellow-500 border-yellow-500 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                          A pedido
                        </button>
                      </div>
                      {productForm.stockStatus === 'IN_STOCK' && (
                        useMatrix ? (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 font-medium">
                              Stock por {hasSizes && hasColorMap ? `${rubroInfo?.atributo?.toLowerCase() || 'talle'} y color` : hasSizes ? (rubroInfo?.atributo?.toLowerCase() || 'talle') : 'color'}
                            </p>
                            <StockMatrixInput
                              sizes={productForm.productSizes}
                              sizeColorMap={hasColorMap ? productForm.productColors : null}
                              flatColors={hasColors ? productForm.productColors : []}
                              matrix={productForm.stockMatrix}
                              onChange={m => setProductForm(f => ({ ...f, stockMatrix: m }))}
                              atributoLabel={rubroInfo?.atributo || 'Talle'}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="showQty" checked={productForm.showStockQuantity}
                              onChange={e => setProductForm(f => ({ ...f, showStockQuantity: e.target.checked }))} className="rounded" />
                            <label htmlFor="showQty" className="text-sm text-gray-600 dark:text-slate-400">Mostrar cantidad</label>
                            {productForm.showStockQuantity && (
                              <input type="number" min="0" value={productForm.stockCount}
                                onChange={e => setProductForm(f => ({ ...f, stockCount: e.target.value }))}
                                placeholder="0"
                                className="ml-2 w-20 px-2 py-1 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Talles y colores por producto */}
            {(() => {
              const rubroInfo = catalog.rubro ? getRubro(catalog.rubro) : null
              return (
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-4">
                  {rubroInfo && rubroInfo.atributo && (
                    <CsvInput
                      label={`${rubroInfo.atributo}s disponibles`}
                      values={productForm.productSizes}
                      onChange={v => setProductForm(f => ({ ...f, productSizes: v }))}
                      placeholder={rubroInfo.opcionesDefault.slice(0, 4).join(', ') || `Ej: ${rubroInfo.atributo} 1, ${rubroInfo.atributo} 2`}
                      hint={`Ingresá las opciones separadas por coma. Ej: ${rubroInfo.opcionesDefault.slice(0, 4).join(', ')}. Cada valor separado por coma será una opción individual.`}
                    />
                  )}
                  {rubroInfo && rubroInfo.atributo ? (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Colores por {rubroInfo.atributo.toLowerCase()}</p>
                      <SizeColorEditor
                        sizes={productForm.productSizes}
                        sizeColorMap={productForm.productColors}
                        onChange={v => setProductForm(f => ({ ...f, productColors: v }))}
                      />
                    </div>
                  ) : (
                    <CsvInput
                      label="Colores disponibles"
                      values={Array.isArray(productForm.productColors) ? productForm.productColors : []}
                      onChange={v => setProductForm(f => ({ ...f, productColors: v }))}
                      placeholder="Rojo, Azul, Negro, Blanco"
                      hint="Ingresá los colores separados por coma. Ej: Rojo, Azul, Negro, Blanco. Cada color separado por coma será una opción individual."
                    />
                  )}
                </div>
              )
            })()}

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
            <p className="text-gray-400 dark:text-slate-500 text-sm">Sin productos. Agrega uno manualmente, desde el repositorio o importa un Excel.</p>
            <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">Columnas Excel: nombre, descripcion, precio, sku, categoria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {catalog.products.map(product => (
              <div key={product.id} className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 transition-opacity ${!product.active ? 'opacity-60' : ''}`}>
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
                      {!product.active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">Oculto</span>
                      )}
                      {product.category && product.category.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                        <span key={c} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">{c}</span>
                      ))}
                      {product.price != null && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          ${Number(product.price).toLocaleString('es-AR')}
                        </span>
                      )}
                      {product.showStock && product.stockStatus && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          product.stockStatus === 'IN_STOCK'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {product.stockStatus === 'IN_STOCK' ? 'En stock' : 'A pedido'}
                          {product.showStockQuantity && product.stockCount != null && ` (${product.stockCount})`}
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 whitespace-pre-line">{product.description}</p>
                    )}
                    {(() => {
                      const sizes = (() => { try { return product.productSizes ? JSON.parse(product.productSizes) : [] } catch { return [] } })()
                      const colors = (() => { try { const _p = product.productColors ? JSON.parse(product.productColors) : []; return Array.isArray(_p) ? _p : [...new Set(Object.values(_p).flat())] } catch { return [] } })()
                      if (!sizes.length && !colors.length) return null
                      return (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sizes.map(s => <span key={s} className="text-xs px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full">{s}</span>)}
                          {colors.map(c => <span key={c} className="text-xs px-1.5 py-0.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full">{c}</span>)}
                        </div>
                      )
                    })()}
                    {product.aiDescription && (
                      <div className="mt-2 pl-3 border-l-2 border-violet-400 dark:border-violet-500">
                        <p className="text-xs text-violet-500 dark:text-violet-400 font-medium mb-0.5">IA</p>
                        <p className="text-sm text-gray-600 dark:text-slate-300 italic">{product.aiDescription}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-auto shrink-0">
                    <button
                      title={product.active ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                      onClick={() => handleToggleActive(product.id)}
                      className={`p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                        product.active
                          ? 'text-green-500 dark:text-green-400 hover:text-green-600'
                          : 'text-gray-400 dark:text-slate-500 hover:text-green-500 dark:hover:text-green-400'
                      }`}>
                      {product.active ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                    <button
                      title="Mover al repositorio (queda guardado)"
                      onClick={() => handleUnlinkProduct(product.id)}
                      className="p-1.5 text-gray-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
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

      {/* Modal: Agregar desde repositorio */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRepoModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Agregar desde repositorio</h3>
            {loadingRepo ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">Cargando...</p>
            ) : repoProducts.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">No hay productos disponibles en el repositorio.</p>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1">
                {repoProducts.map(p => (
                  <button key={p.id} onClick={() => handleAssignFromRepo(p.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{p.name}</p>
                      {p.category && <p className="text-xs text-gray-400 dark:text-slate-500">{p.category}</p>}
                    </div>
                    {p.price != null && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                        ${Number(p.price).toLocaleString('es-AR')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowRepoModal(false)}
              className="mt-4 w-full py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
