import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import CatalogsPage from './pages/CatalogsPage'
import CatalogDetailPage from './pages/CatalogDetailPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCatalogsPage from './pages/admin/AdminCatalogsPage'
import AdminEmailPage from './pages/admin/AdminEmailPage'
import AdminBackgroundsPage from './pages/admin/AdminBackgroundsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import SettingsPage from './pages/SettingsPage'
import TermsPage from './pages/TermsPage'
import PublicCatalogPage from './pages/PublicCatalogPage'
import StockPage from './pages/StockPage'
import LocalesPage from './pages/LocalesPage'
import StorePage from './pages/StorePage'
import OrdersPage from './pages/OrdersPage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster richColors position="top-right" />
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/catalogs" element={
                <ProtectedRoute><CatalogsPage /></ProtectedRoute>
              } />
              <Route path="/catalogs/:id" element={
                <ProtectedRoute><CatalogDetailPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/stock" element={
                <ProtectedRoute><StockPage /></ProtectedRoute>
              } />
              <Route path="/locales" element={
                <ProtectedRoute><LocalesPage /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute><SettingsPage /></ProtectedRoute>
              } />
              <Route path="/p/:slug" element={<PublicProfilePage />} />
              <Route path="/c/:catalogId" element={<PublicCatalogPage />} />
              <Route path="/s/:storeSlug" element={<StorePage />} />
              <Route path="/admin" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
              <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>} />
              <Route path="/admin/catalogs" element={<AdminProtectedRoute><AdminCatalogsPage /></AdminProtectedRoute>} />
              <Route path="/admin/email" element={<AdminProtectedRoute><AdminEmailPage /></AdminProtectedRoute>} />
              <Route path="/admin/backgrounds" element={<AdminProtectedRoute><AdminBackgroundsPage /></AdminProtectedRoute>} />
              <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrdersPage /></AdminProtectedRoute>} />
              <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReportsPage /></AdminProtectedRoute>} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
