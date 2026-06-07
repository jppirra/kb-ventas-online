import api from './axios'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const storesApi = {
  list: () => api.get('/stores'),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  remove: (id) => api.delete(`/stores/${id}`),
  assignCatalog: (storeId, catalogId) => api.put(`/stores/${storeId}/catalogs/${catalogId}`),
  unassignCatalog: (catalogId) => api.delete(`/stores/catalogs/${catalogId}`),
  slugSuggestion: (name) => api.get('/stores/slug-suggestion', { params: { name } }),
}

export const publicStoreApi = {
  getStore: (storeSlug) => axios.get(`${BASE_URL}/public/s/${storeSlug}`),
}
