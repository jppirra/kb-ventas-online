import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Layout from '../components/Layout'
import ImageUpload from '../components/ImageUpload'
import { profileApi } from '../api/profile'

const PLATFORMS = [
  { value: 'WHATSAPP', label: 'WhatsApp', placeholder: 'https://wa.me/5491112345678' },
  { value: 'INSTAGRAM', label: 'Instagram', placeholder: 'https://instagram.com/tuusuario' },
  { value: 'LINKEDIN', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/tuusuario' },
  { value: 'FACEBOOK', label: 'Facebook', placeholder: 'https://facebook.com/tupagina' },
  { value: 'TIKTOK', label: 'TikTok', placeholder: 'https://tiktok.com/@tuusuario' },
  { value: 'WEBSITE', label: 'Sitio web', placeholder: 'https://tusitioweb.com' },
]

const TONES = [
  { value: 'PROFESIONAL', label: 'Profesional', desc: 'Formal y orientado a resultados' },
  { value: 'CERCANO', label: 'Cercano', desc: 'Cálido y conversacional' },
  { value: 'CREATIVO', label: 'Creativo', desc: 'Original e impactante' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bioGen, setBioGen] = useState({ open: false, rubro: '', productTypes: '', tone: 'PROFESIONAL', loading: false })
  const [form, setForm] = useState({
    slug: '', bio: '', brandColorPrimary: '#2563eb', brandColorSecondary: '#7c3aed',
    whatsappNumber: '', socialLinks: [],
  })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await profileApi.get()
      setProfile(data)
      setForm({
        slug: data.slug || '',
        bio: data.bio || '',
        brandColorPrimary: data.brandColorPrimary || '#2563eb',
        brandColorSecondary: data.brandColorSecondary || '#7c3aed',
        whatsappNumber: data.whatsappNumber || '',
        socialLinks: data.socialLinks?.length > 0
          ? data.socialLinks
          : [{ platform: 'WHATSAPP', url: '', sortOrder: 0 }],
      })
    } catch {
      toast.error('Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  async function loadSlugSuggestion() {
    try {
      const { data } = await profileApi.getSlugSuggestion()
      setForm(f => ({ ...f, slug: data.slug }))
    } catch { /* ignore */ }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await profileApi.update({
        ...form,
        socialLinks: form.socialLinks.filter(l => l.url?.trim()),
      })
      setProfile(data)
      toast.success('Perfil guardado')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar perfil')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateBio(e) {
    e.preventDefault()
    setBioGen(b => ({ ...b, loading: true }))
    try {
      const { data } = await profileApi.generateBio({
        rubro: bioGen.rubro,
        productTypes: bioGen.productTypes,
        tone: bioGen.tone,
      })
      setForm(f => ({ ...f, bio: data.bio }))
      setBioGen(b => ({ ...b, open: false, loading: false }))
      toast.success('Bio generada con IA')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar la bio')
      setBioGen(b => ({ ...b, loading: false }))
    }
  }

  function updateLink(idx, field, value) {
    setForm(f => ({
      ...f,
      socialLinks: f.socialLinks.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }))
  }

  function addLink() {
    setForm(f => ({
      ...f,
      socialLinks: [...f.socialLinks, { platform: 'INSTAGRAM', url: '', sortOrder: f.socialLinks.length }],
    }))
  }

  function removeLink(idx) {
    setForm(f => ({ ...f, socialLinks: f.socialLinks.filter((_, i) => i !== idx) }))
  }

  if (loading) return <Layout><div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div></Layout>

  const publicUrl = form.slug ? `/p/${form.slug}` : null

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Ver página pública
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Banner + Avatar */}
        <div className="relative mb-12">
          <ImageUpload
            label="Banner (16:9)"
            currentUrl={profile?.bannerImageUrl}
            onUpload={async (file) => {
              const { data } = await profileApi.uploadBanner(file)
              setProfile(p => ({ ...p, bannerImageUrl: data.url }))
              toast.success('Banner actualizado')
            }}
            aspectRatio="16/5"
            className="w-full rounded-2xl overflow-hidden"
          />
          <div className="absolute -bottom-8 left-6">
            <ImageUpload
              label="Avatar"
              currentUrl={profile?.profileImageUrl}
              onUpload={async (file) => {
                const { data } = await profileApi.uploadAvatar(file)
                setProfile(p => ({ ...p, profileImageUrl: data.url }))
                toast.success('Avatar actualizado')
              }}
              aspectRatio="1/1"
              className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden shadow-md"
            />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              URL de tu perfil público
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border border-gray-300 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                <span className="px-3 text-sm text-gray-400 dark:text-slate-500 shrink-0">/p/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="tu-nombre"
                  className="flex-1 py-2 pr-3 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
              {!form.slug && (
                <button type="button" onClick={loadSlugSuggestion}
                  className="px-3 py-2 text-xs border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 transition-colors">
                  Sugerir
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Bio</label>
              <button
                type="button"
                onClick={() => setBioGen(b => ({ ...b, open: !b.open }))}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/60 font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar con IA
              </button>
            </div>

            {/* Panel generador IA */}
            {bioGen.open && (
              <form onSubmit={handleGenerateBio} className="mb-3 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Generador de bio con IA</p>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Tu rubro</label>
                  <input
                    type="text"
                    value={bioGen.rubro}
                    onChange={e => setBioGen(b => ({ ...b, rubro: e.target.value }))}
                    placeholder="Ej: indumentaria femenina, electrónica, gastronomía"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Tipos de productos</label>
                  <input
                    type="text"
                    value={bioGen.productTypes}
                    onChange={e => setBioGen(b => ({ ...b, productTypes: e.target.value }))}
                    placeholder="Ej: remeras, vestidos, accesorios"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-slate-400 mb-2">Tono</label>
                  <div className="flex gap-2">
                    {TONES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setBioGen(b => ({ ...b, tone: t.value }))}
                        className={`flex-1 py-2 px-2 rounded-xl border text-xs font-medium transition-colors text-center ${
                          bioGen.tone === t.value
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-violet-400 dark:hover:border-violet-500'
                        }`}
                      >
                        <span className="block font-semibold">{t.label}</span>
                        <span className="block opacity-75 mt-0.5 hidden sm:block">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={bioGen.loading}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {bioGen.loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Generando...
                      </>
                    ) : 'Generar bio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBioGen(b => ({ ...b, open: false }))}
                    className="px-4 py-2 text-sm text-gray-500 dark:text-slate-400 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              maxLength={500}
              placeholder="Contá quién sos y qué vendés..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 text-right">{form.bio.length}/500</p>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Número de WhatsApp (para botón de contacto)
            </label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
              placeholder="5491112345678 (sin + ni espacios)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Brand colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Colores de marca</label>
            <div className="flex gap-4">
              {[
                { key: 'brandColorPrimary', label: 'Primario' },
                { key: 'brandColorSecondary', label: 'Secundario' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-9 h-9 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{form[key]}</p>
                  </div>
                </div>
              ))}
              {/* Preview */}
              <div className="ml-auto flex gap-2 items-center">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.brandColorPrimary }} />
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.brandColorSecondary }} />
              </div>
            </div>
          </div>

          {/* Social links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Redes sociales</label>
              <button type="button" onClick={addLink}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                + Agregar
              </button>
            </div>
            <div className="space-y-2">
              {form.socialLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={link.platform}
                    onChange={e => updateLink(idx, 'platform', e.target.value)}
                    className="text-sm px-2 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateLink(idx, 'url', e.target.value)}
                    placeholder={PLATFORMS.find(p => p.value === link.platform)?.placeholder}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => removeLink(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
