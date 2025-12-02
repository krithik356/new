import { request, API_BASE_URL, ApiError } from '../services/apiClient'

export const TARequirementAPI = {
  fetchList: (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/api/payroll/ta-requirements${query}`, { token })
  },

  create: (token, payload) =>
    request('/api/payroll/ta-requirements', {
      method: 'POST',
      body: payload,
      token,
    }),

  update: (token, id, payload) =>
    request(`/api/payroll/ta-requirements/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    }),

  remove: (token, id) =>
    request(`/api/payroll/ta-requirements/${id}`, {
      method: 'DELETE',
      token,
    }),

  sync: (token, roles) =>
    request('/api/payroll/ta-requirements/sync', {
      method: 'POST',
      body: { roles },
      token,
    }),

  exportSheet: async (token, { department } = {}) => {
    const params = new URLSearchParams()
    if (department && department !== 'all') {
      params.append('department', department)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await fetch(
      `${API_BASE_URL}/api/payroll/ta-requirements/export${query}`,
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
        payload?.message ?? 'Failed to export the TA requirements sheet.'
      throw new ApiError(message, response.status, payload)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ||
        'ta_requirements.xlsx'
      : 'ta_requirements.xlsx'

    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, filename }
  },
}
