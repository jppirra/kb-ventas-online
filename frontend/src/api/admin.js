import api from './axios'

export const adminApi = {
  // Stats
  stats: () => api.get('/admin/stats'),

  // Users
  users: () => api.get('/admin/users'),
  toggleEnabled: (id, reason) => api.patch(`/admin/users/${id}/toggle-enabled`, { reason }),
  userModerationLog: (id) => api.get(`/admin/users/${id}/moderation-log`),
  toggleAdmin: (id) => api.patch(`/admin/users/${id}/toggle-admin`),
  updateEmail: (id, email) => api.patch(`/admin/users/${id}/email`, { email }),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  resendVerification: (id) => api.post(`/admin/users/${id}/resend-verification`),
  verifyEmail: (id) => api.post(`/admin/users/${id}/verify-email`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  bulkBlock: (ids, reason) => api.post('/admin/users/bulk/block', { ids, reason }),
  bulkUnblock: (ids, reason) => api.post('/admin/users/bulk/unblock', { ids, reason }),
  bulkResendVerification: (ids) => api.post('/admin/users/bulk/resend-verification', { ids }),
  bulkResetPassword: (ids) => api.post('/admin/users/bulk/reset-password', { ids }),
  bulkDelete: (ids) => api.post('/admin/users/bulk/delete', { ids }),

  // Orders
  orders: () => api.get('/admin/orders'),

  // Reports
  reports: () => api.get('/admin/reports'),

  // Catalogs
  catalogs: () => api.get('/admin/catalogs'),
  toggleCatalogActive: (id, reason) => api.patch(`/admin/catalogs/${id}/toggle-active`, { reason }),
  catalogModerationLog: (id) => api.get(`/admin/catalogs/${id}/moderation-log`),
  deleteCatalog: (id) => api.delete(`/admin/catalogs/${id}`),

  // Email
  sendEmail: (data) => api.post('/admin/email/send', data),
  sendTestEmail: (toEmail) => api.post(`/admin/email-test?toEmail=${encodeURIComponent(toEmail)}`),
  emailLogs: (page = 0, size = 30) => api.get(`/admin/email-logs?page=${page}&size=${size}`),
  emailSettings: () => api.get('/admin/settings/email'),
  saveEmailSettings: (data) => api.put('/admin/settings/email', data),

  // AI Settings
  aiConfig: () => api.get('/admin/settings/ai'),
  saveAiConfig: (data) => api.put('/admin/settings/ai', data),

  // Background templates
  backgrounds: () => api.get('/admin/backgrounds'),
  createBackground: (data) => api.post('/admin/backgrounds', data),
  updateBackground: (id, data) => api.put(`/admin/backgrounds/${id}`, data),
  deleteBackground: (id) => api.delete(`/admin/backgrounds/${id}`),
  uploadBackgroundImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/admin/backgrounds/${id}/upload-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}
