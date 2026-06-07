import api from './axios'

export const productsApi = {
  list: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/products/${id}/upload-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadGalleryImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/products/${id}/upload-gallery-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}
