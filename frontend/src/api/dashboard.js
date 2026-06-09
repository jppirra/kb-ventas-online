import api from './axios'

export const dashboardApi = {
  getStats: (month) => api.get('/dashboard/stats', month ? { params: { month } } : {}),
}
