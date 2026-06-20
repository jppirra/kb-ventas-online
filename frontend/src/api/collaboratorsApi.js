import api from './axios'

export const collaboratorsApi = {
  invite: (data) => api.post('/collaborators/invite', data),
  list: () => api.get('/collaborators'),
  update: (id, data) => api.put(`/collaborators/${id}`, data),
  revoke: (id) => api.delete(`/collaborators/${id}`),
  accept: (token) => api.post(`/collaborators/accept/${token}`),
  inviteInfo: (token) => api.get(`/collaborators/invite-info/${token}`),
  myAccess: () => api.get('/collaborators/my-access'),
}
