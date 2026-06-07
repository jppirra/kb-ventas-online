import api from './axios'

export const reportsApi = {
  report: (publicId, data) => api.post(`/public/catalog/${publicId}/report`, data),
}
