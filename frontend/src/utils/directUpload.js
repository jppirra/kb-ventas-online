import { compressImage } from './imageCompress'

// Compresses the file then calls uploadFn(compressedFile, onProgress) → returns public URL string
export async function uploadCompressed(file, uploadFn, onProgress) {
  onProgress?.(0)
  const compressed = await compressImage(file)
  onProgress?.(5)
  return uploadFn(compressed, (pct) => onProgress?.(5 + Math.round(pct * 0.95)))
}
