import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    if (token && userId) {
      setUser({
        token,
        refreshToken: localStorage.getItem('refreshToken'),
        userId,
        userName: localStorage.getItem('userName'),
        email: localStorage.getItem('email') || null,
        appAdmin: localStorage.getItem('appAdmin') === 'true',
        emailVerified: localStorage.getItem('emailVerified') === 'true',
        termsAccepted: localStorage.getItem('termsAccepted') === 'true',
      })
    }
    setLoading(false)
  }, [])

  const storeUser = (data) => {
    const { token, refreshToken, userId, userName, email, appAdmin, emailVerified, termsAccepted } = data
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken || '')
    localStorage.setItem('userId', String(userId))
    localStorage.setItem('userName', userName || '')
    localStorage.setItem('email', email || '')
    localStorage.setItem('appAdmin', String(appAdmin || false))
    localStorage.setItem('emailVerified', String(emailVerified || false))
    localStorage.setItem('termsAccepted', String(termsAccepted || false))
    setUser({ token, refreshToken, userId: String(userId), userName, email,
      appAdmin: Boolean(appAdmin), emailVerified: Boolean(emailVerified), termsAccepted: Boolean(termsAccepted) })
  }

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    storeUser(response.data)
    return response.data
  }

  const acceptTerms = async () => {
    await api.post('/auth/accept-terms')
    localStorage.setItem('termsAccepted', 'true')
    setUser(u => u ? { ...u, termsAccepted: true } : u)
  }

  const logout = () => {
    const theme = localStorage.getItem('theme')
    localStorage.clear()
    if (theme) localStorage.setItem('theme', theme)
    setUser(null)
    window.location.href = '/login'
  }

  const isAuthenticated = Boolean(user?.token)

  return (
    <AuthContext.Provider value={{ user, login, logout, storeUser, acceptTerms, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthContext
