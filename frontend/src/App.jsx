import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute, PublicRoute } from './components/routing/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import DashboardPage from './pages/Dashboard.jsx'
import DepartmentsPage from './pages/Departments.jsx'
import EmployeesPage from './pages/Employees.jsx'
import PayrollPage from './pages/Payroll.jsx'
import NonPayrollOverviewPage from './pages/nonPayroll/NonPayrollOverview.jsx'
import NonPayrollContractorsPage from './pages/nonPayroll/NonPayrollContractors.jsx'
import NonPayrollVendorsPage from './pages/nonPayroll/NonPayrollVendors.jsx'
import NonPayrollInternsPage from './pages/nonPayroll/NonPayrollInterns.jsx'
import NonPayrollProductsPage from './pages/nonPayroll/NonPayrollProducts.jsx'
import NonPayrollSpendEfficiencyPage from './pages/nonPayroll/NonPayrollSpend.jsx'
import NonPayrollContractsRisksPage from './pages/nonPayroll/NonPayrollContracts.jsx'
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
          <Route path="departments" element={<AdminOnlyRoute><DepartmentsPage /></AdminOnlyRoute>} />
          <Route path="non-payroll">
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOnlyRoute><NonPayrollOverviewPage /></AdminOnlyRoute>} />
            <Route path="contractors" element={<AdminOrHodRoute><NonPayrollContractorsPage /></AdminOrHodRoute>} />
            <Route path="vendors" element={<AdminOrHodRoute><NonPayrollVendorsPage /></AdminOrHodRoute>} />
            <Route path="interns" element={<AdminOrHodRoute><NonPayrollInternsPage /></AdminOrHodRoute>} />
            <Route path="products" element={<AdminOrHodRoute><NonPayrollProductsPage /></AdminOrHodRoute>} />
            <Route path="spend-efficiency" element={<AdminOrHodRoute><NonPayrollSpendEfficiencyPage /></AdminOrHodRoute>} />
            <Route path="contracts-risks" element={<AdminOrHodRoute><NonPayrollContractsRisksPage /></AdminOrHodRoute>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
