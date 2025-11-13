import { apiClient } from './apiClient.js'

export async function login(credentials) {
  const payload = await apiClient.login(credentials)

  return {
    token: payload.data?.token,
    user: payload.data?.user,
  }
}

