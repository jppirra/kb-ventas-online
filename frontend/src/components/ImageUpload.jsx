import React, { useRef, useState } from 'react'
import ImageModal from './ImageModal'

export default function ImageUpload({ label, currentUrl, onUpload, aspectRatio = '1/1', className = '' }) {
  const inputRef = useRef()
  const [progress, setProgress] = useState(null) // null = idle, 0-100 = uploading
  const [preview, setPreview] = useState(false)

  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setProgress(0)
    try {
      await onUpload(file, setProgress)
    } finally {
      setProgress(null)
      e.target.value = ''
    }
  }

  const uploading = progress !== null

  return (
    <>
      {preview && currentUrl && (
        <ImageModal src={currentUrl} alt={label} onClose={() => setPreview(false)} />
      )}
      <div className={`relative group ${className}`} style={{ aspectRatio }}>
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 dark:text-slate-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-400 dark:text-slate-500">{label}</span>
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 rounded-xl bg-black/60 flex flex-col items-center justify-center gap-2 px-4">
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white text-xs font-medium">{progress}%</span>
          </div>
        ) : (
          <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button" onClick={() => inputRef.current.click()}
              className="text-white text-xs font-medium hover:underline">
              Cambiar
            </button>
            {currentUrl && (
              <button type="button" onClick={() => setPreview(true)}
                className="text-white/80 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
    </>
  )
}
