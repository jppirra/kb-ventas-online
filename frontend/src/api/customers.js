import api from './axios'

export const customersApi = {
  list: (month) => api.get('/customers', month ? { params: { month } } : {}),
}
