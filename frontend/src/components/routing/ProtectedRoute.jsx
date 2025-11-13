import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../providers/AuthProvider.jsx'

export function ProtectedRoute({ redirectTo = '/login' }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export function PublicRoute({ redirectTo = '/' }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}


