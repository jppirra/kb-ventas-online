import api from './axios'

export const adminApi = {
  // Stats
  stats: () => api.get('/admin/stats'),

  // Users
  users: () => api.get('/admin/users'),
  toggleEnabled: (id) => api.patch(`/admin/users/${id}/toggle-enabled`),
  toggleAdmin: (id) => api.patch(`/admin/users/${id}/toggle-admin`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Catalogs
  catalogs: () => api.get('/admin/catalogs'),
  toggleCatalogActive: (id) => api.patch(`/admin/catalogs/${id}/toggle-active`),
  deleteCatalog: (id) => api.delete(`/admin/catalogs/${id}`),

  // Email
  sendEmail: (data) => api.post('/admin/email/send', data),
}
