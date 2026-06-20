import api from './axios'

export const dashboardApi = {
  getStats: (month) => api.get('/dashboard/stats', month ? { params: { month } } : {}),
  getTopProducts: () => api.get('/dashboard/top-products'),
}
