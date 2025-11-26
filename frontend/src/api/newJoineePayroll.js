import { request, ApiError, API_BASE_URL } from '../services/apiClient'

export const NewJoineePayrollAPI = {
  fetchList: (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/payroll/new-joinees${query}`, { token })
  },

  create: (token, payload) =>
    request('/api/payroll/new-joinees', {
      method: 'POST',
      body: payload,
      token,
    }),

  update: (token, id, payload) =>
    request(`/api/payroll/new-joinees/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    }),

  remove: (token, id) =>
    request(`/api/payroll/new-joinees/${id}`, {
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
      `${API_BASE_URL}/api/payroll/new-joinees/export${query}`,
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
        // ignore parse issues
      }
      const message =
        payload?.message ?? 'Failed to export the new joinee sheet.'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ||
        'new_joinee_sheet.xlsx'
      : 'new_joinee_sheet.xlsx'

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
      `${API_BASE_URL}/api/payroll/new-joinees/upload${query}`,
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
        payload?.message ?? 'Failed to upload the new joinee sheet.'
      throw new ApiError(message, response.status, payload)
    }

    return payload
  },
}


