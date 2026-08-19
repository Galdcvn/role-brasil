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
import DetalheEventoPageOrganizador from './pages/portal/organizador/DetalheEventoPage'
import NovoEventoPage from './pages/portal/organizador/NovoEventoPage'
import EditarEventoPage from './pages/portal/organizador/EditarEventoPage'
import RelatoriosPage from './pages/portal/organizador/RelatoriosPage'
import InicioPage from './pages/portal/cliente/InicioPage'
import DetalheEventoPage from './pages/portal/cliente/DetalheEventoPage'
import IngressosPage from './pages/portal/cliente/IngressosPage'
import DetalheIngressoPage from './pages/portal/cliente/DetalheIngressoPage'
import NotFoundPage from './pages/NotFoundPage'

function PortalRoutes() {
  return (
    <PortalProvider>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route index element={<Navigate to="organizador" replace />} />
          <Route path="cliente" element={<InicioPage />} />
          <Route path="cliente/evento/:id" element={<DetalheEventoPage />} />
          <Route path="cliente/ingressos" element={<IngressosPage />} />
          <Route path="cliente/ingressos/:id" element={<DetalheIngressoPage />} />
          <Route path="organizador" element={<DashboardPage />} />
          <Route path="organizador/eventos" element={<EventosPage />} />
          <Route path="organizador/evento/novo" element={<NovoEventoPage />} />
          <Route path="organizador/evento/:id" element={<DetalheEventoPageOrganizador />} />
          <Route path="organizador/evento/:id/editar" element={<EditarEventoPage />} />
          <Route path="organizador/relatorios" element={<RelatoriosPage />} />
          <Route path="portaria" element={<InicioPage />} />
          <Route path="portaria/*" element={<InicioPage />} />
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
