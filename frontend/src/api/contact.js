import api from './axios'

export const contactApi = {
  submit: (data) => api.post('/contact', data),
  all: () => api.get('/admin/contact'),
  unreadCount: () => api.get('/admin/contact/unread-count'),
  markRead: (id) => api.post(`/admin/contact/${id}/read`),
}
