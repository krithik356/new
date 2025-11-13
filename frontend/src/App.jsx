import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute, PublicRoute } from './components/routing/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import DashboardPage from './pages/Dashboard.jsx'
import DepartmentsPage from './pages/Departments.jsx'
import EmployeesPage from './pages/Employees.jsx'
import ContributionsPage from './pages/Contributions.jsx'
import LoginPage from './pages/Login.jsx'
import ProfilePage from './pages/Profile.jsx'
import { useAuth } from './providers/AuthProvider.jsx'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route element={<PublicRoute redirectTo="/" />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="contributions" element={<ContributionsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
