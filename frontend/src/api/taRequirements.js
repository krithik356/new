import { request } from '../services/apiClient'

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
}


