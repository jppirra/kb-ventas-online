import api from './axios'

export const settingsApi = {
  changePassword: (data) => api.post('/settings/change-password', data),
  deleteAccount: () => api.delete('/settings/account'),
}
