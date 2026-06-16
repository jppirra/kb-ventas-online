import api from '../api/axios'
import { compressImage } from './imageCompress'

function uploadToUrl(file, signedUrl, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg')
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Supabase ${xhr.status}: ${xhr.responseText}`))
    }
    xhr.onerror = () => reject(new Error('Error de red'))
    xhr.send(file)
  })
}

export async function directUpload(file, folder, onProgress) {
  const compressed = await compressImage(file)
  const ext = compressed.name.split('.').pop() || 'jpg'
  const { data } = await api.post(`/uploads/presign?folder=${folder}&ext=${ext}`)
  onProgress?.(5)
  await uploadToUrl(compressed, data.signedUrl, (pct) => onProgress?.(5 + Math.round(pct * 0.95)))
  return data.publicUrl
}
