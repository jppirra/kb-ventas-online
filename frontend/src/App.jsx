import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import TermsModal from './components/TermsModal'
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
import AdminDiagnosticsPage from './pages/admin/AdminDiagnosticsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminNpsPage from './pages/admin/AdminNpsPage'
import AdminContactPage from './pages/admin/AdminContactPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminRubrosPage from './pages/admin/AdminRubrosPage'
import SettingsPage from './pages/SettingsPage'
import ContactPage from './pages/ContactPage'
import TermsPage from './pages/TermsPage'
import PublicCatalogPage from './pages/PublicCatalogPage'
import StockPage from './pages/StockPage'
import LocalesPage from './pages/LocalesPage'
import StorePage from './pages/StorePage'
import OrdersPage from './pages/OrdersPage'
import TicketsPage from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import TicketConfigPage from './pages/TicketConfigPage'
import CustomersPage from './pages/CustomersPage'
import CollaboratorsPage from './pages/CollaboratorsPage'
import InviteAcceptPage from './pages/InviteAcceptPage'
import ExplorarPage from './pages/ExplorarPage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  window.location.replace('/mercato/')
  return null
}

const PUBLIC_PATHS = ['/c/', '/p/', '/s/', '/explorer']

function TermsGate({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  const { pathname } = useLocation()
  const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (loading || !isAuthenticated || isPublicPage) return children
  if (user && !user.termsAccepted) return <>{children}<TermsModal /></>
  return children
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <TermsGate>
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
              <Route path="/catalogos" element={<Navigate to="/catalogs" replace />} />
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
              <Route path="/customers" element={
                <ProtectedRoute><CustomersPage /></ProtectedRoute>
              } />
              <Route path="/collaborators" element={
                <ProtectedRoute><CollaboratorsPage /></ProtectedRoute>
              } />
              <Route path="/invite" element={<InviteAcceptPage />} />
              <Route path="/orders" element={
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/tickets" element={
                <ProtectedRoute><TicketsPage /></ProtectedRoute>
              } />
              <Route path="/tickets/:id" element={
                <ProtectedRoute><TicketDetailPage /></ProtectedRoute>
              } />
              <Route path="/tickets/config" element={
                <ProtectedRoute><TicketConfigPage /></ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute><SettingsPage /></ProtectedRoute>
              } />
              <Route path="/p/:slug" element={<PublicProfilePage />} />
              <Route path="/c/:catalogId" element={<PublicCatalogPage />} />
              <Route path="/catalogs/:id/preview" element={<ProtectedRoute><PublicCatalogPage previewMode /></ProtectedRoute>} />
              <Route path="/s/:storeSlug" element={<StorePage />} />
              <Route path="/admin" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
              <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsersPage /></AdminProtectedRoute>} />
              <Route path="/admin/catalogs" element={<AdminProtectedRoute><AdminCatalogsPage /></AdminProtectedRoute>} />
              <Route path="/admin/email" element={<AdminProtectedRoute><AdminEmailPage /></AdminProtectedRoute>} />
              <Route path="/admin/backgrounds" element={<AdminProtectedRoute><AdminBackgroundsPage /></AdminProtectedRoute>} />
              <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrdersPage /></AdminProtectedRoute>} />
              <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReportsPage /></AdminProtectedRoute>} />
              <Route path="/admin/diagnostics" element={<AdminProtectedRoute><AdminDiagnosticsPage /></AdminProtectedRoute>} />
              <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettingsPage /></AdminProtectedRoute>} />
              <Route path="/admin/nps" element={<AdminProtectedRoute><AdminNpsPage /></AdminProtectedRoute>} />
              <Route path="/admin/contact" element={<AdminProtectedRoute><AdminContactPage /></AdminProtectedRoute>} />
              <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminAnalyticsPage /></AdminProtectedRoute>} />
              <Route path="/admin/rubros" element={<AdminProtectedRoute><AdminRubrosPage /></AdminProtectedRoute>} />
              <Route path="/explorer" element={<ExplorarPage />} />
              <Route path="/explorar" element={<ExplorarPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </TermsGate>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
