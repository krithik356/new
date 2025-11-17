const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'

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

  getContributions: (token, { cycle } = {}) =>
    request(`/api/contributions${cycle ? `/all?cycle=${encodeURIComponent(cycle)}` : '/all'}`, { token }),

  getEmployeesWithContributions: (token, { cycle } = {}) =>
    request(`/api/contributions/employees${cycle ? `?cycle=${encodeURIComponent(cycle)}` : ''}`, { token }),

  getContributionByDepartment: (token, departmentId) =>
    request(`/api/contributions/department/${departmentId}`, { token }),

  exportDepartmentReport: async (token, { cycle } = {}) => {
    const url = `/api/contributions/export/departments${cycle ? `?cycle=${encodeURIComponent(cycle)}` : ''}`
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const payload = await parseJsonSafely(response)
      const message = payload?.message ?? 'Failed to export report'
      throw new ApiError(message, response.status, payload)
    }

    // Get the blob and create download link
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
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const payload = await parseJsonSafely(response)
      const message = payload?.message ?? 'Failed to export employee contributions'
      throw new ApiError(message, response.status, payload)
    }

    // Get the blob and create download link
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
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const payload = await parseJsonSafely(response)
      const message = payload?.message ?? 'Failed to export department employee contributions'
      throw new ApiError(message, response.status, payload)
    }

    // Get the blob and create download link
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
}


