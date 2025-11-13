import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../providers/AuthProvider.jsx'

const EMPTY_FORM = { email: '', password: '' }

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, signIn, loading, error } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      setSuccessMessage(null)
    }
  }, [error])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const trimmedEmail = form.email.trim().toLowerCase()
      const trimmedPassword = form.password.trim()

      if (!trimmedEmail || !trimmedPassword) {
        throw new Error('Please provide both email and password.')
      }

      await signIn({ email: trimmedEmail, password: trimmedPassword })
      setSuccessMessage('Welcome back! Redirecting you to the dashboard...')
      setForm(EMPTY_FORM)
    } catch (err) {
      const message = err?.message ?? 'Unable to sign in. Please try again.'
      setSuccessMessage(null)
      console.error('[Login] Sign-in failed:', message)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-20 text-slate-100">
      <section className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="relative hidden overflow-hidden bg-emerald-500/10 lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-transparent mix-blend-screen" />
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.3) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
            <div className="relative flex h-full flex-col justify-between p-12">
              <header>
                <p className="text-sm uppercase tracking-[0.5em] text-emerald-200/70">Employee Portal</p>
                <h1 className="mt-6 text-4xl font-semibold text-slate-100">
                  Insightful dashboards for teams who shape the future.
                </h1>
              </header>
              <ul className="space-y-4 text-sm text-emerald-100/80">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg">☑️</span>
                  <span>Track contributions, assess team performance, and stay aligned with your departmental goals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg">☑️</span>
                  <span>Access curated data tables with rich filters and contextual insights, all within a single workspace.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg">☑️</span>
                  <span>Collaborate securely with role-aware access crafted for Admins and HODs.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="px-8 py-12 sm:px-12">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
                Welcome
              </p>
              <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Sign in to continue</h2>
              <p className="text-sm leading-6 text-slate-400">
                Enter the credentials provided by your administrator to manage contributions, employees, and departments.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-200">
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-black/40 transition focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  disabled={loading}
                />
              </label>

              <label className="block text-sm font-medium text-slate-200">
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-black/40 transition focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  disabled={loading}
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 text-xs leading-5 text-slate-500">
              This portal is restricted to authorized personnel. All actions are logged and monitored for compliance.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}


