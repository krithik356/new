const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

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

  getEmployees: (token) => request('/api/employees', { token }),

  getDepartments: (token) => request('/api/departments', { token }),

  getDepartmentById: (token, departmentId) => request(`/api/departments/${departmentId}`, { token }),

  getContributions: (token, { cycle } = {}) =>
    request(`/api/contributions${cycle ? `/all?cycle=${encodeURIComponent(cycle)}` : '/all'}`, { token }),

  getContributionByDepartment: (token, departmentId) =>
    request(`/api/contributions/department/${departmentId}`, { token }),
}


