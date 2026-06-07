import api from './axios'

export const ordersApi = {
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
}
