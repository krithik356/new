import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute, PublicRoute } from './components/routing/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import DashboardPage from './pages/Dashboard.jsx'
import DepartmentsPage from './pages/Departments.jsx'
import EmployeesPage from './pages/Employees.jsx'
import PayrollPage from './pages/Payroll.jsx'
import NonPayrollPage from './pages/NonPayroll.jsx'
import LoginPage from './pages/Login.jsx'
import { useAuth } from './providers/AuthProvider.jsx'
import { ViewModeProvider } from './providers/ViewModeProvider.jsx'

function AdminOnlyRoute({ children }) {
  const { user } = useAuth()
  
  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />
  }
  
  return children
}

function AdminOrHodRoute({ children }) {
  const { user } = useAuth()

  if (user?.role !== 'Admin' && user?.role !== 'HOD') {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route element={<PublicRoute redirectTo="/" />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={(
            <ViewModeProvider>
              <DashboardLayout />
            </ViewModeProvider>
          )}
        >
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<AdminOrHodRoute><EmployeesPage /></AdminOrHodRoute>} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="non-payroll" element={<NonPayrollPage />} />
          <Route path="departments" element={<AdminOnlyRoute><DepartmentsPage /></AdminOnlyRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
