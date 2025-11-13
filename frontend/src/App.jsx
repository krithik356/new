import { useMemo, useState } from 'react'

import { login as loginRequest } from './services/auth.js'

const EMPTY_FORM = { email: '', password: '' }

function getStoredAuth() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem('auth')
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)

    if (!parsed?.token || !parsed?.user) {
      return null
    }

    return parsed
  } catch {
    window.localStorage.removeItem('auth')
    return null
  }
}

function App() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [auth, setAuth] = useState(() => getStoredAuth())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const displayName = useMemo(() => {
    if (!auth?.user) {
      return ''
    }

    return auth.user.name || auth.user.email || 'Authenticated user'
  }, [auth])

  function updateMessage(type, text) {
    if (!text) {
      setMessage(null)
      return
    }

    setMessage({ type, text })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (loading) {
      return
    }

    const email = form.email.trim().toLowerCase()
    const password = form.password.trim()

    if (!email || !password) {
      updateMessage('error', 'Enter both email and password before continuing.')
      return
    }

    try {
      setLoading(true)
      updateMessage(null, null)

      const result = await loginRequest({ email, password })

      const authPayload = {
        token: result.token,
        user: result.user,
      }

      setAuth(authPayload)
      window.localStorage.setItem('auth', JSON.stringify(authPayload))
      setForm(EMPTY_FORM)
      updateMessage('success', `Welcome back, ${result.user?.name ?? result.user?.email ?? 'friend'}!`)
    } catch (error) {
      updateMessage('error', error?.message ?? 'Unable to sign you in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setAuth(null)
    window.localStorage.removeItem('auth')
    setForm(EMPTY_FORM)
    updateMessage('info', 'You have been signed out.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-900/80 p-10 shadow-2xl shadow-black/50 backdrop-blur-sm">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">Employee Portal</h1>
          <p className="text-sm text-slate-400">
            Sign in to access contribution tracking, employee management, and departmental insights.
          </p>
        </header>

        {message ? (
          <div
            className={[
              'mt-8 rounded-xl border px-4 py-3 text-sm transition',
              message.type === 'error' && 'border-red-500/50 bg-red-500/10 text-red-200',
              message.type === 'success' && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
              message.type === 'info' && 'border-blue-500/40 bg-blue-500/10 text-blue-200',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {message.text}
          </div>
        ) : null}

        {auth ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">Signed in as</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">{displayName}</h2>
              <dl className="mt-4 space-y-2 text-sm text-slate-300">
                <div>
                  <dt className="font-medium text-slate-400">Email</dt>
                  <dd>{auth.user?.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-400">Role</dt>
                  <dd className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/70 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                    {auth.user?.role ?? 'Member'}
                  </dd>
                </div>
                {auth.user?.department ? (
                  <div>
                    <dt className="font-medium text-slate-400">Department</dt>
                    <dd>
                      <span className="font-medium text-slate-200">{auth.user.department.name}</span>
                      {auth.user.department.code ? (
                        <span className="ml-2 text-xs uppercase tracking-wider text-slate-500">
                          ({auth.user.department.code})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="space-y-3 text-sm text-slate-400">
              <p>
                You can now continue to the portal dashboard or navigate to employee management features. Token-based
                authentication is stored securely for this session.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-left text-sm font-medium text-slate-200" htmlFor="email">
                Email address
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/20 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  disabled={loading}
                  required
                />
              </label>

              <label className="block text-left text-sm font-medium text-slate-200" htmlFor="password">
                Password
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-xl border border-slate-800/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner shadow-black/20 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  disabled={loading}
                  required
                />
              </label>
            </div>

            <div className="space-y-3 text-sm text-slate-400">
              <p>Use your company credentials provided by the administrator.</p>
              <p className="text-xs text-slate-500">
                The API base URL can be configured with <code className="font-mono text-emerald-300">VITE_API_URL</code>.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default App
