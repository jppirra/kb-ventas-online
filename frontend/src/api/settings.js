import api from './axios'

export const settingsApi = {
  changePassword: (data) => api.post('/settings/change-password', data),
  deleteAccount: () => api.delete('/settings/account'),
  getStockReportConfig: () => api.get('/settings/stock-report'),
  saveStockReportConfig: (data) => api.put('/settings/stock-report', data),
}
