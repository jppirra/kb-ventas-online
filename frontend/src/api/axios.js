import axios from 'axios'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

function clearAuthStorage() {
  const theme = localStorage.getItem('theme')
  localStorage.clear()
  if (theme) localStorage.setItem('theme', theme)
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Attach Bearer token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isAuthEndpoint = originalRequest.url?.includes('/auth/')
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => { originalRequest.headers.Authorization = `Bearer ${token}`; return api(originalRequest) })
          .catch((err) => Promise.reject(err))
      }
      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) { clearAuthStorage(); window.location.href = '/login'; return Promise.reject(error) }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { token, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('token', token)
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${token}`
        processQueue(null, token)
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthStorage()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (!error.response) {
      toast.error('Sin conexión con el servidor.')
    } else if (error.response.status >= 500) {
      toast.error(error.response.data?.message || 'Error interno del servidor.')
    }

    return Promise.reject(error)
  }
)

export default api
