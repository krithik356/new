import { useMemo } from 'react'

import { useAuth } from '../providers/AuthProvider.jsx'

function maskToken(token) {
  if (!token) return 'No token available'
  if (token.length <= 12) return token
  return `${token.slice(0, 6)}••••${token.slice(-4)}`
}

export default function ProfilePage() {
  const { user, token } = useAuth()

  const profileDetails = useMemo(
    () => [
      { label: 'Full name', value: user?.name ?? 'Not provided' },
      { label: 'Email address', value: user?.email ?? 'Not provided' },
      {
        label: 'Role',
        value: user?.role ?? 'Member',
      },
      {
        label: 'Department',
        value: user?.department
          ? `${user.department.name}${user.department.code ? ` (${user.department.code})` : ''}`
          : 'Not assigned',
      },
    ],
    [user]
  )

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Profile</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Review your account details, confirm your current role, and keep track of the access token used for API calls.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <article className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
            <h2 className="text-lg font-semibold text-slate-100">Personal information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {profileDetails.map((detail) => (
                <div key={detail.label}>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{detail.label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-200">{detail.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
            <h2 className="text-lg font-semibold text-slate-100">API token</h2>
            <p className="mt-3 text-sm text-slate-400">
              Securely stored in your browser. You can copy it for authenticated API calls in trusted environments.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 font-mono text-sm text-emerald-300">
                {maskToken(token)}
              </div>
              <CopyButton token={token} />
            </div>
          </article>
        </div>

        <div className="md:col-span-2 space-y-6">
          <article className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
            <h2 className="text-lg font-semibold text-slate-100">Helpful tips</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-2xl border border-slate-800/60 bg-slate-950/50 px-4 py-3">
                Keep your credentials private. Contact your administrator if anything looks incorrect.
              </li>
              <li className="rounded-2xl border border-slate-800/60 bg-slate-950/50 px-4 py-3">
                You can refresh your token by signing out and signing back in from the login screen.
              </li>
              <li className="rounded-2xl border border-slate-800/60 bg-slate-950/50 px-4 py-3">
                If you require additional permissions, submit a request through the IT support channel.
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}

function CopyButton({ token }) {
  const handleCopy = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
    } catch (error) {
      console.error('Failed to copy token', error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!token}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Copy token
    </button>
  )
}


