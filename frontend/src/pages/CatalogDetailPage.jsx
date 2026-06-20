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
import { useRubros } from '../hooks/useRubros'

const emptyProduct = { name: '', description: '', price: '', offerPrice: '', sku: '', categories: [], imageUrl: '', extraImages: [], videoUrl: '', showStock: false, stockStatus: 'IN_STOCK', stockCount: '', showStockQuantity: false, productSizes: [], productColors: {}, stockMatrix: {} }

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

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

function effectiveOffer(product, catalogDiscount) {
  const base = Number(product.price)
  const catalogOffer = catalogDiscount > 0 ? base * (1 - catalogDiscount / 100) : null
  const prodOffer = product.offerPrice != null ? Number(product.offerPrice) : null
  if (catalogOffer && prodOffer) return Math.min(catalogOffer, prodOffer)
  return prodOffer ?? catalogOffer
}

function TagInput({ label, values, onChange, placeholder }) {
  const [editingIdx, setEditingIdx] = useState(null)
  const [editText, setEditText] = useState('')
  const [newText, setNewText] = useState('')

  function commitEdit(idx) {
    const v = toTitleCase(editText.trim())
    if (v) {
      const next = [...values]
      next[idx] = v
      onChange(next)
    } else {
      onChange(values.filter((_, i) => i !== idx))
    }
    setEditingIdx(null)
    setEditText('')
  }

  function addTag(raw) {
    raw.split(',').map(t => toTitleCase(t.trim())).filter(Boolean).forEach(v => {
      if (!values.includes(v)) onChange([...values, v])
    })
    setNewText('')
  }

  function handleNewKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (newText.trim()) addTag(newText)
    } else if (e.key === 'Backspace' && !newText && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 px-2.5 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus-within:ring-2 focus-within:ring-blue-500 min-h-[2.5rem] cursor-text">
        {values.map((v, idx) => (
          editingIdx === idx ? (
            <input
              key={idx}
              autoFocus
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={() => commitEdit(idx)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit(idx) }
                else if (e.key === 'Escape') { setEditingIdx(null); setEditText('') }
              }}
              className="text-xs px-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 outline-none border border-blue-400"
              style={{ width: Math.max((editText.length + 2) * 7, 50) + 'px' }}
            />
          ) : (
            <span key={idx} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-indigo-100 dark:bg-indigo-700/60 text-indigo-800 dark:text-indigo-100 border border-indigo-300 dark:border-indigo-500 rounded-lg text-xs font-medium">
              <button type="button" onClick={() => { setEditingIdx(idx); setEditText(v) }}
                className="hover:underline leading-none">
                {v}
              </button>
              <button type="button" onClick={() => onChange(values.filter((_, i) => i !== idx))}
                className="text-blue-400 hover:text-red-500 dark:text-blue-500 dark:hover:text-red-400 leading-none p-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )
        ))}
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={handleNewKeyDown}
          onBlur={() => { if (newText.trim()) addTag(newText) }}
          placeholder={values.length === 0 ? placeholder : '+ agregar'}
          className="flex-1 min-w-[70px] text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none py-0.5"
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Clic en una categoría para editar · Enter o coma para agregar · Backspace para eliminar la última</p>
    </div>
  )
}

function CsvInput({ label, values, onChange, placeholder, hint, titleCase = false }) {
  const [text, setText] = useState(() => values.join(', '))
  useEffect(() => { setText(values.join(', ')) }, [values.join(',')])
  function commit() {
    const arr = text.split(',').map(v => v.trim()).filter(Boolean).map(v => titleCase ? toTitleCase(v) : v)
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
  const coverFileRef = useRef()
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
  const [reverting, setReverting] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

  // Drag-and-drop reorder
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const productFormRef = useRef(null)
  const [showReorderModal, setShowReorderModal] = useState(false)
  const [reorderDraft, setReorderDraft] = useState([])
  const dragReorderIdx = useRef(null)
  const dragOverReorderIdx = useRef(null)
  const [draggingReorderId, setDraggingReorderId] = useState(null)
  const [dragOverReorderId, setDragOverReorderId] = useState(null)
  const [sectionOrder, setSectionOrder] = useState([])
  const [newSectionName, setNewSectionName] = useState('')
  const [renamingSection, setRenamingSection] = useState(null) // { idx, value }

  const rubros = useRubros()

  // Appearance state (synced on load, saved separately)
  const [viewMode, setViewMode] = useState('GRID')
  const [bgType, setBgType] = useState('NONE')
  const [bgColor, setBgColor] = useState('#f8fafc')
  const [bgTemplateId, setBgTemplateId] = useState(null)
  const [bgTemplates, setBgTemplates] = useState([])
  const [bgModalIdx, setBgModalIdx] = useState(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [bgProgress, setBgProgress] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [selectedRubro, setSelectedRubro] = useState('')
  const [catalogDiscount, setCatalogDiscount] = useState('')
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
      setSelectedRubro(data.rubro || '')
      setCatalogDiscount(data.discount ?? '')
      try { setSectionOrder(data.sectionOrder ? JSON.parse(data.sectionOrder) : []) } catch { setSectionOrder([]) }
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

  function handleDragStart(e, index, productId) {
    dragIdx.current = index
    setDraggingId(productId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnter(index, productId) {
    dragOverIdx.current = index
    setDragOverId(productId)
  }

  function handleDragEnd() {
    const from = dragIdx.current
    const to = dragOverIdx.current
    setDraggingId(null)
    setDragOverId(null)
    dragIdx.current = null
    dragOverIdx.current = null
    if (from === null || to === null || from === to) return
    const items = [...catalog.products]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    const reordered = items.map((p, i) => ({ ...p, sortOrder: i }))
    setCatalog(c => ({ ...c, products: reordered }))
    catalogsApi.reorderProducts(id, reordered.map((p, i) => ({ id: p.id, sortOrder: i })))
      .catch(() => toast.error('Error al guardar el orden'))
  }

  function handleModalDragStart(e, index, productId) {
    dragReorderIdx.current = index
    setDraggingReorderId(productId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleModalDragEnter(index, productId) {
    dragOverReorderIdx.current = index
    setDragOverReorderId(productId)
  }

  function handleModalDragEnd() {
    const from = dragReorderIdx.current
    const to = dragOverReorderIdx.current
    setDraggingReorderId(null)
    setDragOverReorderId(null)
    dragReorderIdx.current = null
    dragOverReorderIdx.current = null
    if (from === null || to === null || from === to) return
    const items = [...reorderDraft]
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    setReorderDraft(items.map((p, i) => ({ ...p, sortOrder: i })))
  }

  async function handleSaveReorder() {
    const withOrder = reorderDraft.map((p, i) => ({ ...p, sortOrder: i }))
    setCatalog(c => ({ ...c, products: withOrder }))
    setShowReorderModal(false)
    try {
      await catalogsApi.reorderProducts(id, withOrder.map(p => ({ id: p.id, sortOrder: p.sortOrder })))
    } catch {
      toast.error('Error al guardar el orden')
    }
  }

  function scrollToForm() {
    setTimeout(() => productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  function cloneProduct(product) {
    let extraImages = []
    try { extraImages = product.extraImagesJson ? JSON.parse(product.extraImagesJson) : [] } catch {}
    let productSizes = []
    let productColors = {}
    let stockMatrix = {}
    try { productSizes = product.productSizes ? JSON.parse(product.productSizes) : [] } catch {}
    try {
      const pc = product.productColors ? JSON.parse(product.productColors) : null
      if (pc && !Array.isArray(pc)) productColors = pc
    } catch {}
    try { stockMatrix = product.stockMatrix ? JSON.parse(product.stockMatrix) : {} } catch {}
    const categories = product.category
      ? product.category.split(',').map(c => c.trim()).filter(Boolean)
      : []
    setEditingProductId(null)
    setProductForm({
      name: product.name + ' (copia)',
      description: product.description || '',
      price: product.price ?? '',
      offerPrice: product.offerPrice ?? '',
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
    setShowProductForm(true)
    scrollToForm()
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
        offerPrice: product.offerPrice ?? '',
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
    scrollToForm()
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    if (!productForm.name.trim()) return
    setSavingProduct(true)
    const wasEditing = editingProductId
    const prevProducts = catalog.products
    const hasMatrix = Object.keys(productForm.stockMatrix).length > 0
    const payload = {
      ...productForm,
      category: productForm.categories.length > 0 ? productForm.categories.join(', ') : null,
      price: productForm.price !== '' ? parseFloat(productForm.price) : null,
      offerPrice: productForm.offerPrice !== '' ? parseFloat(productForm.offerPrice) : null,
      stockCount: !hasMatrix && productForm.stockCount !== '' ? parseInt(productForm.stockCount) : null,
      extraImagesJson: productForm.extraImages.length > 0 ? JSON.stringify(productForm.extraImages) : null,
      videoUrl: productForm.videoUrl || null,
      productSizes: productForm.productSizes.length > 0 ? JSON.stringify(productForm.productSizes) : null,
      productColors: Object.keys(productForm.productColors).length > 0 ? JSON.stringify(productForm.productColors) : null,
      stockMatrix: hasMatrix ? JSON.stringify(productForm.stockMatrix) : null,
    }
    try {
      if (wasEditing) {
        await catalogsApi.updateProduct(id, wasEditing, payload)
        toast.success('Producto actualizado')
      } else {
        await catalogsApi.addProduct(id, payload)
        toast.success('Producto agregado')
      }
      setShowProductForm(false)
      // Reload but preserve current drag-and-drop order
      const { data: fresh } = await catalogsApi.get(id)
      if (wasEditing) {
        setCatalog(prev => ({
          ...fresh,
          products: prev.products.map(p => fresh.products.find(u => u.id === p.id) || p).filter(Boolean)
        }))
      } else {
        const currentIds = new Set(prevProducts.map(p => p.id))
        const newProd = fresh.products.find(p => !currentIds.has(p.id))
        const preserved = [
          ...prevProducts.map(p => fresh.products.find(u => u.id === p.id) || p),
          ...(newProd ? [newProd] : [])
        ]
        const withOrder = preserved.map((p, i) => ({ ...p, sortOrder: i }))
        setCatalog({ ...fresh, products: withOrder })
        if (newProd) {
          catalogsApi.reorderProducts(id, withOrder.map(p => ({ id: p.id, sortOrder: p.sortOrder }))).catch(() => {})
        }
      }
    } catch {
      toast.error('Error al guardar producto')
    } finally {
      setSavingProduct(false)
    }
  }

  function handleDeleteProduct(productId) {
    const prod = catalog.products.find(p => p.id === productId)
    setConfirmModal({
      title: 'Eliminar producto',
      description: `"${prod?.name}" se eliminará permanentemente. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await catalogsApi.deleteProduct(id, productId)
          setCatalog(c => ({ ...c, products: c.products.filter(p => p.id !== productId) }))
          toast.success('Producto eliminado')
        } catch { toast.error('Error al eliminar producto') }
      },
    })
  }

  function handleToggleActive(productId) {
    const prod = catalog.products.find(p => p.id === productId)
    if (prod?.active) {
      setConfirmModal({
        title: 'Ocultar producto',
        description: `"${prod.name}" dejará de mostrarse en el catálogo. Podés volver a activarlo cuando quieras.`,
        confirmLabel: 'Ocultar',
        danger: false,
        onConfirm: async () => {
          setConfirmModal(null)
          try {
            const { data } = await catalogsApi.toggleProductActive(id, productId)
            setCatalog(c => ({ ...c, products: c.products.map(p => p.id === productId ? { ...p, active: data.active } : p) }))
            toast.success('Producto oculto')
          } catch { toast.error('Error al cambiar visibilidad') }
        },
      })
    } else {
      catalogsApi.toggleProductActive(id, productId)
        .then(({ data }) => {
          setCatalog(c => ({ ...c, products: c.products.map(p => p.id === productId ? { ...p, active: data.active } : p) }))
          toast.success('Producto visible en el catálogo')
        })
        .catch(() => toast.error('Error al cambiar visibilidad'))
    }
  }

  function handleUnlinkProduct(productId) {
    const prod = catalog.products.find(p => p.id === productId)
    setConfirmModal({
      title: 'Mover al repositorio',
      description: `"${prod?.name}" se desvinculará del catálogo pero quedará guardado en tu repositorio de productos.`,
      confirmLabel: 'Mover al repositorio',
      danger: false,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await catalogsApi.unlinkProduct(id, productId)
          setCatalog(c => ({ ...c, products: c.products.filter(p => p.id !== productId) }))
          toast.success('Producto movido al repositorio')
        } catch { toast.error('Error al mover al repositorio') }
      },
    })
  }

  function confirmRevert() {
    setConfirmModal({
      title: 'Revertir a versión publicada',
      description: 'Se restaurará la apariencia, nombre, descripción y lista de productos a como estaban en la última publicación. Los cambios no publicados se perderán.',
      confirmLabel: 'Revertir',
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null)
        setReverting(true)
        try {
          const { data } = await catalogsApi.revert(id)
          setCatalog(c => ({
            ...c,
            name: data.name,
            description: data.description,
            hasDraftChanges: false,
            viewMode: data.viewMode,
            backgroundType: data.backgroundType,
            backgroundColor: data.backgroundColor,
            backgroundImageUrl: data.backgroundImageUrl,
            coverImageUrl: data.coverImageUrl,
            rubro: data.rubro,
            discount: data.discount,
            sectionOrder: data.sectionOrder,
            aiContent: data.aiContent,
          }))
          toast.success('Catálogo revertido a la última versión publicada')
          load()
        } catch (err) {
          toast.error(err.response?.data?.message || 'Error al revertir')
        } finally { setReverting(false) }
      },
    })
  }

  async function openRepoModal() {
    setShowRepoModal(true)
    setLoadingRepo(true)
    try {
      const { data } = await catalogsApi.ownerStock(id)
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

  async function handleCoverImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const { data } = await uploadCompressed(file, (compressed, onPct) => {
        const fd = new FormData()
        fd.append('file', compressed)
        return api.post(`/catalogs/${id}/upload-cover`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: ev => ev.total && onPct(Math.round(ev.loaded / ev.total * 100))
        })
      }, () => {})
      setCatalog(c => ({ ...c, coverImageUrl: data.coverImageUrl }))
      toast.success('Imagen de portada subida')
    } catch {
      toast.error('Error al subir portada')
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  async function handleRenameSection(idx, newName) {
    const oldName = sectionOrder[idx]
    if (!newName.trim() || newName.trim() === oldName) { setRenamingSection(null); return }
    const trimmed = toTitleCase(newName.trim())
    try {
      await catalogsApi.renameCategory(id, oldName, trimmed)
      setSectionOrder(s => s.map((v, i) => i === idx ? trimmed : v))
      setCatalog(prev => ({
        ...prev,
        products: prev.products.map(p => {
          if (!p.category) return p
          const updated = p.category.split(',').map(c => c.trim()).map(c => c === oldName ? trimmed : c).filter(Boolean).join(', ')
          return { ...p, category: updated }
        })
      }))
      toast.success(`Categoría renombrada a "${trimmed}"`)
    } catch {
      toast.error('Error al renombrar categoría')
    }
    setRenamingSection(null)
  }

  async function handleSaveAppearance() {
    setSavingAppearance(true)
    try {
      const payload = {
        name: catalog.name,
        description: catalog.description,
        viewMode,
        rubro: selectedRubro || null,
        backgroundType: bgType,
        backgroundColor: bgType === 'COLOR' ? bgColor : null,
        backgroundTemplateId: bgType === 'PREDEFINED' ? bgTemplateId : null,
        backgroundImageUrl: bgType === 'CUSTOM' ? catalog.backgroundImageUrl : null,
        discount: catalogDiscount !== '' ? parseInt(catalogDiscount) : 0,
        sectionOrder: sectionOrder.length > 0 ? JSON.stringify(sectionOrder) : '',
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
            <a
              href={`/catalogs/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors"
              title="Ver cómo lo verá el cliente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Vista previa
            </a>
            {catalog.hasDraftChanges && catalog.publishedAt && (
              <button onClick={confirmRevert} disabled={reverting}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-40">
                {reverting ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                )}
                Revertir
              </button>
            )}
            {catalog.collaboratorCanPublish === false ? (
              <span className="text-xs text-gray-400 dark:text-slate-500 px-2">Sin permiso para publicar</span>
            ) : (
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
            )}
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

          {/* Rubro */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Rubro</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRubro('')}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                  !selectedRubro
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                Sin rubro
              </button>
              {rubros.map(r => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRubro(r.value)}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                    selectedRubro === r.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Imagen de portada</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Se muestra en el explorador de catálogos y en el perfil público del vendedor.</p>
            <div className="flex items-center gap-3">
              {catalog.coverImageUrl ? (
                <img src={catalog.coverImageUrl} alt="Portada" className="w-24 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-600" />
              ) : (
                <div className="w-24 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <button
                onClick={() => coverFileRef.current.click()}
                disabled={uploadingCover}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {uploadingCover ? 'Subiendo...' : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {catalog.coverImageUrl ? 'Cambiar portada' : 'Subir portada'}
                  </>
                )}
              </button>
              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 dark:text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-xl px-3 py-2.5 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                  <p className="font-semibold mb-1">Recomendaciones</p>
                  <ul className="space-y-0.5 text-gray-300 dark:text-slate-300">
                    <li>· Relación: <span className="text-white font-medium">4:3</span> (horizontal)</li>
                    <li>· Ideal: <span className="text-white font-medium">1200×900 px</span></li>
                    <li>· Mínimo: <span className="text-white font-medium">800×600 px</span></li>
                    <li>· Formato: <span className="text-white font-medium">JPG o PNG</span></li>
                    <li>· Máx: <span className="text-white font-medium">10 MB</span></li>
                  </ul>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-slate-700" />
                </div>
              </div>
              <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
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

          {/* Discount */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Descuento general del catálogo</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min="0" max="100" step="1"
                  value={catalogDiscount}
                  onChange={e => setCatalogDiscount(e.target.value)}
                  placeholder="0"
                  className="w-20 px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500 dark:text-slate-400">%</span>
              </div>
              {catalogDiscount > 0 && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-medium">
                  -{catalogDiscount}% en todos los productos
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Si un producto tiene precio oferta, se aplica el mayor descuento de los dos.</p>
          </div>

          {/* Sections / groupers */}
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 font-medium">Secciones (agrupadores)</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Cuando hay secciones definidas, los productos se agrupan bajo el título de la primera categoría que coincida. Los productos sin sección quedan al final.</p>
            {sectionOrder.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {sectionOrder.map((sec, idx) => (
                    <div key={sec + idx} className="flex items-center gap-2">
                      <span className="text-gray-300 dark:text-slate-600 cursor-grab shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                          <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                        </svg>
                      </span>
                      {renamingSection?.idx === idx ? (
                        <>
                          <input
                            autoFocus
                            value={renamingSection.value}
                            onChange={e => setRenamingSection(r => ({ ...r, value: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleRenameSection(idx, renamingSection.value) }
                              if (e.key === 'Escape') { e.preventDefault(); setRenamingSection(null) }
                            }}
                            className="flex-1 px-2 py-1 text-sm rounded-lg border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button type="button" title="Confirmar" onMouseDown={e => { e.preventDefault(); handleRenameSection(idx, renamingSection.value) }}
                            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button type="button" title="Cancelar" onMouseDown={e => { e.preventDefault(); setRenamingSection(null) }}
                            className="text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-gray-700 dark:text-slate-200 px-2 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg">{sec}</span>
                          <button type="button" title="Renombrar" onClick={() => setRenamingSection({ idx, value: sec })}
                            className="text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors p-1 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </>
                      )}
                      {renamingSection?.idx !== idx && (
                        <button type="button" onClick={() => setSectionOrder(s => s.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {/* Chips de categorías existentes no agregadas */}
              {(() => {
                const existing = [...new Set(
                  (catalog.products || []).flatMap(p => p.category ? p.category.split(',').map(c => c.trim()).filter(Boolean) : [])
                )].filter(c => !sectionOrder.includes(c))
                return existing.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mb-2 w-full">
                    {existing.map(c => (
                      <button key={c} type="button" onClick={() => setSectionOrder(s => [...s, c])}
                        className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        + {c}
                      </button>
                    ))}
                  </div>
                ) : null
              })()}
            </div>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newSectionName.trim() && !sectionOrder.includes(newSectionName.trim())) { setSectionOrder(s => [...s, toTitleCase(newSectionName.trim())]); setNewSectionName('') } } }}
                placeholder="Nueva sección personalizada..."
                className="flex-1 px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button"
                onClick={() => { if (newSectionName.trim() && !sectionOrder.includes(newSectionName.trim())) { setSectionOrder(s => [...s, toTitleCase(newSectionName.trim())]); setNewSectionName('') } }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm rounded-xl transition-colors">
                Agregar
              </button>
            </div>
          </div>

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
          {(catalog.products?.length ?? 0) > 1 && (
            <button onClick={() => { setReorderDraft([...catalog.products]); setShowReorderModal(true) }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Reordenar
            </button>
          )}
          <span className="text-sm text-gray-400 dark:text-slate-500 ml-auto">
            {catalog.products?.length ?? 0} productos ({catalog.products?.filter(p => p.active).length ?? 0} visibles)
          </span>
        </div>

        {/* Product form */}
        {showProductForm && (
          <form ref={productFormRef} onSubmit={handleSaveProduct} className="mb-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-4">
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
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Precio oferta</label>
                <input type="number" step="0.01" value={productForm.offerPrice} onChange={e => setProductForm(f => ({ ...f, offerPrice: e.target.value }))}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-slate-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">SKU</label>
                <input type="text" value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <TagInput
                  label="Categorías"
                  values={productForm.categories}
                  onChange={v => setProductForm(f => ({ ...f, categories: v }))}
                  placeholder="Ej: Abrigo, Campera..."
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
            {catalog.products.map((product, index) => (
              <div
                key={product.id}
                draggable
                onDragStart={e => handleDragStart(e, index, product.id)}
                onDragEnter={() => handleDragEnter(index, product.id)}
                onDragOver={e => e.preventDefault()}
                onDragEnd={handleDragEnd}
                className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 transition-all cursor-default select-none
                  ${draggingId === product.id ? 'opacity-40 scale-95' : ''}
                  ${dragOverId === product.id && draggingId !== product.id ? 'border-blue-400 dark:border-blue-500 shadow-md' : 'border-gray-200 dark:border-slate-700'}
                  ${!product.active && draggingId !== product.id ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="cursor-grab active:cursor-grabbing shrink-0 mt-1 text-gray-300 dark:text-slate-600 hover:text-gray-400 dark:hover:text-slate-400 transition-colors" title="Arrastrar para reordenar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>
                      <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
                      <circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
                    </svg>
                  </div>
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
                      {product.price != null && (() => {
                        const offer = effectiveOffer(product, catalogDiscount || 0)
                        return offer != null ? (
                          <span className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                              ${Number(offer).toLocaleString('es-AR')}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              ${Number(product.price).toLocaleString('es-AR')}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            ${Number(product.price).toLocaleString('es-AR')}
                          </span>
                        )
                      })()}
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
                      className="p-1.5 text-gray-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" title="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => cloneProduct(product)}
                      className="p-1.5 text-gray-400 hover:text-green-500 dark:text-slate-500 dark:hover:text-green-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" title="Clonar producto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

      {/* Modal: Reordenar productos */}
      {showReorderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReorderModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reordenar productos</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Arrastrá los productos para cambiar el orden</p>
            <div className="overflow-y-auto space-y-1.5 flex-1">
              {reorderDraft.map((p, index) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={e => handleModalDragStart(e, index, p.id)}
                  onDragEnter={() => handleModalDragEnter(index, p.id)}
                  onDragOver={e => e.preventDefault()}
                  onDragEnd={handleModalDragEnd}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-default select-none
                    ${draggingReorderId === p.id ? 'opacity-40 scale-95' : ''}
                    ${dragOverReorderId === p.id && draggingReorderId !== p.id ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                >
                  <div className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                      <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                    </svg>
                  </div>
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  )}
                  <span className={`text-sm flex-1 truncate ${!p.active ? 'text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-white'}`}>
                    {p.name}
                  </span>
                  {!p.active && <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">oculto</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveReorder}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Guardar orden
              </button>
              <button onClick={() => setShowReorderModal(false)}
                className="px-4 py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmModal.danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${confirmModal.danger ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{confirmModal.title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={confirmModal.onConfirm}
                className={`flex-1 py-2 text-white font-semibold rounded-xl text-sm transition-colors ${confirmModal.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {confirmModal.confirmLabel}
              </button>
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  )
}
