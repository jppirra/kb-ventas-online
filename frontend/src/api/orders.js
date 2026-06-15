import api from './axios'
import { track } from '../utils/track'

export const ordersApi = {
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data).then(r => { track('ORDER_UPDATED'); return r }),
}
