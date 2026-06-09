import api from './axios'

export const catalogsApi = {
  list: () => api.get('/catalogs'),
  get: (id) => api.get(`/catalogs/${id}`),
  create: (data) => api.post('/catalogs', data),
  update: (id, data) => api.put(`/catalogs/${id}`, data),
  remove: (id) => api.delete(`/catalogs/${id}`),

  addProduct: (catalogId, data) => api.post(`/catalogs/${catalogId}/products`, data),
  updateProduct: (catalogId, productId, data) => api.put(`/catalogs/${catalogId}/products/${productId}`, data),
  deleteProduct: (catalogId, productId) => api.delete(`/catalogs/${catalogId}/products/${productId}`),
  toggleProductActive: (catalogId, productId) => api.put(`/catalogs/${catalogId}/products/${productId}/toggle-active`),
  unlinkProduct: (catalogId, productId) => api.put(`/catalogs/${catalogId}/products/${productId}/unlink`),
  assignProduct: (catalogId, productId) => api.put(`/catalogs/${catalogId}/assign/${productId}`),

  uploadProductImage: (catalogId, productId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/catalogs/${catalogId}/products/${productId}/upload-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  uploadBackground: (catalogId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/catalogs/${catalogId}/upload-background`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  uploadExcel: (catalogId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/catalogs/${catalogId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  generate: (catalogId) => api.post(`/catalogs/${catalogId}/generate`),
  publish: (catalogId) => api.post(`/catalogs/${catalogId}/publish`),
}
