import api from './axios'
import { track } from '../utils/track'

export const ticketsApi = {
  list: () => api.get('/tickets'),
  get: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data).then(r => { track('TICKET_CREATED'); return r }),
  updateStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status }),
  remove: (id) => api.delete(`/tickets/${id}`),

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
