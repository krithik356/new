import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { login as loginRequest } from '../services/auth.js'

const STORAGE_KEY = 'auth'

const AuthContext = createContext(null)

function readStoredAuth() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.user) {
      return null
    }
    return parsed
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function persistAuth(auth) {
  if (typeof window === 'undefined') {
    return
  }

  if (!auth) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    persistAuth(auth)
  }, [auth])

  const signIn = useCallback(async ({ email, password }) => {
    setLoading(true)
    setError(null)
    try {
      const result = await loginRequest({ email, password })
      setAuth({
        token: result.token,
        user: result.user,
      })
      return result
    } catch (err) {
      setError(err?.message ?? 'Unable to sign in.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    setAuth(null)
    setError(null)
  }, [])

  const updateUser = useCallback((updater) => {
    setAuth((prev) => {
      if (!prev) {
        return prev
      }
      const nextUser = typeof updater === 'function' ? updater(prev.user) : updater
      return {
        ...prev,
        user: nextUser,
      }
    })
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({
      token: auth?.token ?? null,
      user: auth?.user ?? null,
      isAuthenticated: Boolean(auth?.token),
      signIn,
      signOut,
      loading,
      error,
      clearError,
      updateUser,
    }),
    [auth, signIn, signOut, loading, error, updateUser, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


