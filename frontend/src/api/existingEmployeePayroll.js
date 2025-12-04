import { request, ApiError, API_BASE_URL } from '../services/apiClient'

export const ExistingEmployeePayrollAPI = {
  fetchList: (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/payroll/existing-employees${query}`, { token })
  },

  create: (token, payload) =>
    request('/api/payroll/existing-employees', {
      method: 'POST',
      body: payload,
      token,
    }),

  update: (token, id, payload) =>
    request(`/api/payroll/existing-employees/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    }),

  remove: (token, id) =>
    request(`/api/payroll/existing-employees/${id}`, {
      method: 'DELETE',
      token,
    }),

  exportSheet: async (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await fetch(
      `${API_BASE_URL}/api/payroll/existing-employees/export${query}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      let payload = null
      try {
        payload = await response.json()
      } catch {
        // ignore parse error
      }
      const message =
        payload?.message ?? 'Failed to export the existing employees sheet.'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ||
        'existing_employees.xlsx'
      : 'existing_employees.xlsx'

    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, filename }
  },

  uploadSheet: async (token, file, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${API_BASE_URL}/api/payroll/existing-employees/upload${query}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        payload?.message ?? 'Failed to upload the existing employees sheet.'
      throw new ApiError(message, response.status, payload)
    }

    return payload
  },

  requestSignOff: (token, id) =>
    request(`/api/payroll/existing-employees/${id}/signoff`, {
      method: 'POST',
      token,
    }),

  decideSignOff: (token, id, decision, remark) =>
    request(`/api/payroll/existing-employees/${id}/signoff/decision`, {
      method: 'POST',
      body: { decision, remark },
      token,
    }),
}

