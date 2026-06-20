import api from './axios'

export const paymentsApi = {
  // OAuth
  getMpAuthUrl: () => api.get('/tickets/config/mercadopago/auth-url'),
  connectMp: (code, state) => api.post('/tickets/config/mercadopago/connect', { code, state }),
  getMpStatus: () => api.get('/tickets/config/mercadopago/status'),
  disconnectMp: () => api.delete('/tickets/config/mercadopago'),

  // Pagos
  createPreference: (ticketId) => api.post(`/tickets/${ticketId}/payment/mercadopago`),
  getPaymentStatus: (ticketId) => api.get(`/tickets/${ticketId}/payment/status`),
  resetPayment: (ticketId) => api.post(`/tickets/${ticketId}/payment/reset`),
}
