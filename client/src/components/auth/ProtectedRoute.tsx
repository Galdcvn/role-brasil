import { Navigate } from 'react-router-dom'

function isAutenticado(): boolean {
  return localStorage.getItem('token') !== null
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAutenticado()) {
    return <Navigate to="/login" replace />
  }
  return children
}
