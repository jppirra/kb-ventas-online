import React, { useEffect } from 'react'

export default function ImageModal({ src, alt = '', onClose, prev, next, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && prev) prev()
      if (e.key === 'ArrowRight' && next) next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Anterior */}
      {prev && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
        onClick={e => e.stopPropagation()}
      />

      {/* Siguiente */}
      {next && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Cerrar */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {alt && !children && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-3 py-1 rounded-full">
          {alt}
        </p>
      )}
      {children}
    </div>
  )
}
