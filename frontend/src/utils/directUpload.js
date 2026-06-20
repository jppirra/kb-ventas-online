import { compressImage } from './imageCompress'

// Comprime el archivo y llama a uploadFn(compressedFile, onProgress) → retorna la URL pública
export async function uploadCompressed(file, uploadFn, onProgress) {
  onProgress?.(0)
  const compressed = await compressImage(file)
  onProgress?.(5)
  return uploadFn(compressed, (pct) => onProgress?.(5 + Math.round(pct * 0.95)))
}
