import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PortalProvider } from './contexts/PortalContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PortalLayout from './components/portal/PortalLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SelecaoPapelPage from './pages/SelecaoPapelPage'
import RegistroPage from './pages/RegistroPage'
import DashboardPage from './pages/portal/organizador/DashboardPage'
import EventosPage from './pages/portal/organizador/EventosPage'
import NovoEventoPage from './pages/portal/organizador/NovoEventoPage'
import RelatoriosPage from './pages/portal/organizador/RelatoriosPage'
import ClientePlaceholderPage from './pages/portal/cliente/PlaceholderPage'
import NotFoundPage from './pages/NotFoundPage'

function PortalRoutes() {
  return (
    <PortalProvider>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route index element={<Navigate to="organizador" replace />} />
          <Route path="cliente" element={<ClientePlaceholderPage />} />
          <Route path="cliente/*" element={<ClientePlaceholderPage />} />
          <Route path="organizador" element={<DashboardPage />} />
          <Route path="organizador/eventos" element={<EventosPage />} />
          <Route path="organizador/evento/novo" element={<NovoEventoPage />} />
          <Route path="organizador/relatorios" element={<RelatoriosPage />} />
          <Route path="portaria" element={<ClientePlaceholderPage />} />
          <Route path="portaria/*" element={<ClientePlaceholderPage />} />
          <Route path="*" element={<Navigate to="organizador" replace />} />
        </Route>
      </Routes>
    </PortalProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<SelecaoPapelPage />} />
        <Route path="/registro/cliente" element={<RegistroPage papel="CLIENT" />} />
        <Route
          path="/registro/organizador"
          element={<RegistroPage papel="ORGANIZER" />}
        />
        <Route
          path="/registro/portaria"
          element={<RegistroPage papel="PORTARIA" />}
        />
        <Route path="/404" element={<NotFoundPage />} />
        <Route
          path="/portal/*"
          element={
            <ProtectedRoute>
              <PortalRoutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
