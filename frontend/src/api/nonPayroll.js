import { request, ApiError, API_BASE_URL } from '../services/apiClient.js'

export const NonPayrollAPI = {
  fetchList: (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/non-payroll${query}`, { token })
  },

  create: (token, payload) =>
    request('/api/non-payroll', {
      method: 'POST',
      body: payload,
      token,
    }),

  update: (token, id, payload) =>
    request(`/api/non-payroll/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    }),

  remove: (token, id) =>
    request(`/api/non-payroll/${id}`, {
      method: 'DELETE',
      token,
    }),

  exportSheet: async (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await fetch(`${API_BASE_URL}/api/non-payroll/export${query}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let payload = null
      try {
        payload = await response.json()
      } catch {
        // ignore parsing errors
      }
      const message = payload?.message ?? 'Failed to export the Non-Payroll sheet.'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'non_payroll.xlsx'
      : 'non_payroll.xlsx'

    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, filename }
  },

  uploadSheet: async (token, file, { department, overwrite } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    if (overwrite) {
      params.append('overwrite', 'true')
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/api/non-payroll/upload${query}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message = payload?.message ?? 'Failed to upload the Non-Payroll sheet.'
      throw new ApiError(message, response.status, payload)
    }

    return payload
  },
}


