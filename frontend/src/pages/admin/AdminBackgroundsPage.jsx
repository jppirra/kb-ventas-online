import React, { useEffect, useRef, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { adminApi } from '../../api/admin'
import { toast } from 'sonner'
import ImageModal from '../../components/ImageModal'
import { directUpload } from '../../utils/directUpload'

function BackgroundCard({ bg, onEdit, onDelete, onUploaded, onPreview }) {
  const fileRef = useRef()
  const [progress, setProgress] = useState(null)

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setProgress(0)
    try {
      const publicUrl = await directUpload(file, 'backgrounds', setProgress)
      await adminApi.updateBackground(bg.id, {
        name: bg.name, description: bg.description || '',
        sortOrder: bg.sortOrder, active: bg.active, imageUrl: publicUrl
      })
      onUploaded(bg.id, publicUrl)
      toast.success('Imagen actualizada')
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      setProgress(null)
      e.target.value = ''
    }
  }

  const uploading = progress !== null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div
        className={`aspect-video bg-gray-100 dark:bg-slate-700 relative ${bg.imageUrl ? 'cursor-zoom-in' : ''}`}
        onClick={() => bg.imageUrl && !uploading && onPreview(bg)}
      >
        {bg.imageUrl ? (
          <img src={bg.imageUrl} alt={bg.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 px-4">
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div className="bg-white h-1.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-white text-xs font-medium">{progress}%</span>
          </div>
        )}
        {!bg.active && !uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">Inactivo</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{bg.name}</p>
          <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">#{bg.sortOrder}</span>
        </div>
        {bg.description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{bg.description}</p>
        )}
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => fileRef.current.click()} disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? `${progress}%` : 'Subir imagen'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => onEdit(bg)} disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">
            Editar
          </button>
          <button onClick={() => onDelete(bg.id)} disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

const emptyForm = { name: '', description: '', sortOrder: 0, active: true, imageUrl: '' }

export default function AdminBackgroundsPage() {
  const [backgrounds, setBackgrounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const formFileRef = useRef()
  const [modalBg, setModalBg] = useState(null)

  const withImages = backgrounds.filter(b => b.imageUrl)
  const modalIdx = modalBg ? withImages.findIndex(b => b.id === modalBg.id) : -1

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await adminApi.backgrounds()
      setBackgrounds(data)
    } catch {
      toast.error('Error al cargar fondos')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setPreviewUrl(null)
    setShowForm(true)
  }

  function openEdit(bg) {
    setEditingId(bg.id)
    setForm({ name: bg.name, description: bg.description || '', sortOrder: bg.sortOrder ?? 0, active: bg.active, imageUrl: bg.imageUrl || '' })
    setSelectedFile(null)
    setPreviewUrl(bg.imageUrl || null)
    setShowForm(true)
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setForm(f => ({ ...f, imageUrl: '' }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) }
      let bgId = editingId
      let finalImageUrl = form.imageUrl
      if (selectedFile) {
        finalImageUrl = await directUpload(selectedFile, 'backgrounds', () => {})
      }
      if (editingId) {
        await adminApi.updateBackground(editingId, { ...payload, imageUrl: finalImageUrl || form.imageUrl })
      } else {
        const { data } = await adminApi.createBackground({ ...payload, imageUrl: finalImageUrl })
        bgId = data.id
      }
      toast.success(editingId ? 'Fondo actualizado' : 'Fondo creado')
      setShowForm(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      load()
    } catch {
      toast.error('Error al guardar fondo')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este fondo?')) return
    try {
      await adminApi.deleteBackground(id)
      setBackgrounds(bs => bs.filter(b => b.id !== id))
      toast.success('Fondo eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  function handleUploaded(id, publicUrl) {
    setBackgrounds(bs => bs.map(b => b.id === id ? { ...b, imageUrl: publicUrl } : b))
  }

  return (
    <AdminLayout>
      {modalBg && (
        <ImageModal
          src={modalBg.imageUrl}
          alt={modalBg.name}
          onClose={() => setModalBg(null)}
          prev={modalIdx > 0 ? () => setModalBg(withImages[modalIdx - 1]) : null}
          next={modalIdx < withImages.length - 1 ? () => setModalBg(withImages[modalIdx + 1]) : null}
        />
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fondos de catálogo</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
          + Nuevo fondo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{editingId ? 'Editar fondo' : 'Nuevo fondo'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Nombre *</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Descripcion</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Imagen</label>
              <div className="flex gap-3 items-start">
                {previewUrl && (
                  <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-slate-600">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <button type="button" onClick={() => formFileRef.current.click()}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors w-full justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {selectedFile ? selectedFile.name : 'Subir desde PC'}
                  </button>
                  <input ref={formFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-center">o</p>
                  <input type="url" value={form.imageUrl} onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setSelectedFile(null); setPreviewUrl(e.target.value || null) }}
                    placeholder="URL de imagen externa"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Orden</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="bgActive" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="rounded" />
              <label htmlFor="bgActive" className="text-sm text-gray-700 dark:text-slate-300">Activo (visible para vendedores)</label>
            </div>
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

      {loading ? (
        <div className="text-gray-400 dark:text-slate-500">Cargando...</div>
      ) : backgrounds.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
          <p className="text-gray-400 dark:text-slate-500 text-sm">Sin fondos creados.</p>
          <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">Crea fondos prediseñados que los vendedores podrán usar en sus catálogos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {backgrounds.map(bg => (
            <BackgroundCard key={bg.id} bg={bg} onEdit={openEdit} onDelete={handleDelete} onUploaded={handleUploaded} onPreview={setModalBg} />
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
