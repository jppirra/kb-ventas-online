import api from './axios'
import { track } from '../utils/track'

export const ticketsApi = {
  list: () => api.get('/tickets'),
  get: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data).then(r => { track('TICKET_CREATED'); return r }),
  updateStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status }),
  cancel: (id, reason) => api.patch(`/tickets/${id}/cancel`, { reason }),
  sendEmail: (id) => api.post(`/tickets/${id}/send-email`),
  updateCustomer: (id, data) => api.patch(`/tickets/${id}/customer`, data),
  remove: (id) => api.delete(`/tickets/${id}`),
  confirmLocalPayment: (id, data) => api.post(`/tickets/${id}/confirm-payment`, data || {}),
  uploadPaymentProof: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/tickets/${id}/payment-proof`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  getConfig: () => api.get('/tickets/config'),
  saveConfig: (data) => api.put('/tickets/config', data),
  uploadLogo: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/tickets/config/upload-logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}
