import api from './axios'

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTopProducts: () => api.get('/dashboard/top-products'),
}
