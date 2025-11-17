import { apiClient } from './apiClient.js'

export async function login(credentials) {
  const payload = await apiClient.login(credentials)

  return {
    token: payload.data?.token,
    user: payload.data?.user,
  }
}

export async function signup(data) {
  const payload = await apiClient.signup(data)

  return {
    token: payload.data?.token,
    user: payload.data?.user,
    message: payload.message,
  }
}

