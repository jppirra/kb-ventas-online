import api from './axios'

export const ratingsApi = {
  submit: (data) => api.post('/ratings', data),
  mine: () => api.get('/ratings/mine'),
  all: () => api.get('/admin/ratings'),
  summary: () => api.get('/admin/ratings/summary'),
}
