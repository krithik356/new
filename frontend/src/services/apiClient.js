const DEFAULT_REMOTE_API = 'https://backend-rz5x.onrender.com'

const explicitBase = import.meta.env.VITE_API_URL?.trim()

export const API_BASE_URL =
  explicitBase && explicitBase.length > 0
    ? explicitBase.replace(/\/$/, '')
    : import.meta.env.DEV
      ? ''
      : DEFAULT_REMOTE_API

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function parseJsonSafely(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request(path, { method = 'GET', body, token, headers: customHeaders } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(customHeaders ?? {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await parseJsonSafely(response)

  if (!response.ok) {
    const message =
      payload?.message ??
      payload?.error ??
      (response.status >= 500
        ? 'The server is currently unavailable. Please try again later.'
        : 'We could not complete your request.')

    throw new ApiError(message, response.status, payload)
  }

  return payload
}

export const apiClient = {
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: payload }),

  getEmployees: (token) => request('/api/employees', { token }),

  getDepartments: (token) => request('/api/departments', { token }),
  getDepartmentsPublic: () => request('/api/departments/public'),

  getDepartmentById: (token, departmentId) => request(`/api/departments/${departmentId}`, { token }),

  getContributions: (token, { cycle, year } = {}) => {
    const params = new URLSearchParams()
    if (cycle) params.append('cycle', cycle)
    if (year) params.append('year', year)
    const query = params.toString() ? `/all?${params.toString()}` : '/all'
    return request(`/api/contributions${query}`, { token })
  },

  getEmployeesWithContributions: (token, { cycle, year } = {}) => {
    const params = new URLSearchParams()
    if (cycle) params.append('cycle', cycle)
    if (year) params.append('year', year)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/contributions/employees${query}`, { token })
  },

  getContributionByDepartment: (token, departmentId, { year } = {}) => {
    const query = year ? `?year=${year}` : ''
    return request(`/api/contributions/department/${departmentId}${query}`, { token })
  },

  exportDepartmentReport: async (token, { cycle } = {}) => {
    const url = `/api/contributions/export/departments${cycle ? `?cycle=${encodeURIComponent(cycle)}` : ''}`
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const payload = await parseJsonSafely(response)
      const message = payload?.message ?? 'Failed to export report'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'department_report.xlsx'
      : 'department_report.xlsx'
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, filename }
  },

  exportDepartmentEmployeeContributions: async (token, { cycle } = {}) => {
    const url = `/api/contributions/export/department/employees${cycle ? `?cycle=${encodeURIComponent(cycle)}` : ''}`
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const payload = await parseJsonSafely(response)
      const message = payload?.message ?? 'Failed to export employee contributions'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'employee_contributions.xlsx'
      : 'employee_contributions.xlsx'
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, filename }
  },

  sendSheetToAdmin: async (token, { cycle } = {}) => {
    const url = `/api/contributions/export/department/employees/send${cycle ? `?cycle=${encodeURIComponent(cycle)}` : ''}`
    return request(url, {
      method: 'POST',
      token,
    })
  },

  exportDepartmentEmployeeSheet: async (token, departmentName, { cycle } = {}) => {
    const url = `/api/contributions/export/department/${encodeURIComponent(departmentName)}/employees${cycle ? `?cycle=${encodeURIComponent(cycle)}` : ''}`
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const payload = await parseJsonSafely(response)
      const message = payload?.message ?? 'Failed to export department employee contributions'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `${departmentName}_employee_contributions.xlsx`
      : `${departmentName}_employee_contributions.xlsx`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, filename }
  },

  // Monthly Salary endpoints
  createOrUpdateMonthlySalary: (token, employeeId, { month, year, salary, cycle }) =>
    request(`/api/monthly-salaries/employee/${employeeId}`, {
      method: 'PUT',
      body: { month, year, salary, cycle },
      token,
    }),

  getEmployeeMonthlySalaries: (token, employeeId, { year } = {}) => {
    const query = year ? `?year=${year}` : ''
    return request(`/api/monthly-salaries/employee/${employeeId}${query}`, { token })
  },

  getDepartmentMonthlySalaries: (token, departmentId, { month, year, cycle } = {}) => {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    if (year) params.append('year', year)
    if (cycle) params.append('cycle', cycle)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/monthly-salaries/department/${departmentId}${query}`, { token })
  },

  bulkCreateMonthlySalaries: (token, salaries) =>
    request('/api/monthly-salaries/bulk', {
      method: 'POST',
      body: { salaries },
      token,
    }),

  getMonthlySalaries: (token, { month, year, departmentId } = {}) => {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    if (year) params.append('year', year)
    if (departmentId) params.append('departmentId', departmentId)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/monthly-salaries${query}`, { token })
  },

  getExistingEmployeePayroll: (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department) {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/payroll/existing-employees${query}`, { token })
  },

  createExistingEmployeePayroll: (token, payload) =>
    request('/api/payroll/existing-employees', {
      method: 'POST',
      body: payload,
      token,
    }),

  updateExistingEmployeePayroll: (token, id, payload) =>
    request(`/api/payroll/existing-employees/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    }),

  deleteExistingEmployeePayroll: (token, id) =>
    request(`/api/payroll/existing-employees/${id}`, {
      method: 'DELETE',
      token,
    }),

  exportExistingEmployeePayrollSheet: async (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department) {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const url = `/api/payroll/existing-employees/export/sheet${query}`

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const payload = await parseJsonSafely(response)
      const message = payload?.message ?? 'Failed to export sheet.'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const filename =
      response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
      'existing_employee_payroll.xlsx'
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, filename }
  },
}

