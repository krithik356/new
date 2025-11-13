const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  let payload

  try {
    payload = await response.json()
  } catch (error) {
    throw new Error('Unexpected server response. Please try again.')
  }

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.message ??
      payload?.error ??
      'We could not verify your credentials. Please try again.'
    throw new Error(message)
  }

  return {
    token: payload.data?.token,
    user: payload.data?.user,
  }
}

