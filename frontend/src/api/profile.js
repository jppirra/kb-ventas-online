import api from './axios'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/profile/upload/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadBanner: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/profile/upload/banner', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getSlugSuggestion: () => api.get('/profile/slug-suggestion'),
  generateBio: (data) => api.post('/profile/generate-bio', data),
}

export const publicApi = {
  getProfile: (slug) => axios.get(`${BASE_URL}/public/p/${slug}`),
  getCatalog: (catalogId) => axios.get(`${BASE_URL}/public/catalog/${catalogId}`),
  getBackgrounds: () => axios.get(`${BASE_URL}/public/backgrounds`),
  trackCatalogView: (catalogId) => axios.post(`${BASE_URL}/public/analytics/catalog/${catalogId}/view`).catch(() => {}),
  trackWhatsappClick: (productId) => axios.post(`${BASE_URL}/public/analytics/product/${productId}/whatsapp`).catch(() => {}),
}
