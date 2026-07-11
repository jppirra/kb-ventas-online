import api from './axios'

export const paymentsApi = {
  // OAuth
  getMpAuthUrl: () => api.get('/tickets/config/mercadopago/auth-url'),
  connectMp: (code, state) => api.post('/tickets/config/mercadopago/connect', { code, state }),
  getMpStatus: () => api.get('/tickets/config/mercadopago/status'),
  disconnectMp: () => api.delete('/tickets/config/mercadopago'),

  // Pagos vinculados a ticket
  createPreference: (ticketId) => api.post(`/tickets/${ticketId}/payment/mercadopago`),
  getPaymentStatus: (ticketId) => api.get(`/tickets/${ticketId}/payment/status`),
  resetPayment: (ticketId) => api.post(`/tickets/${ticketId}/payment/reset`),

  // QR de venta presencial (sin ticket asociado)
  generateQrPreference: (amount, description) =>
    api.post('/tickets/qr/mercadopago', { amount, description }),
}
