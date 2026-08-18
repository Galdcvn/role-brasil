import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegistroPage from './pages/RegistroPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage papel="CLIENT" />} />
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
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
