import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../providers/AuthProvider.jsx'
import { useViewMode } from '../providers/ViewModeProvider.jsx'

const MODE_OPTIONS = [
  { value: 'source', label: 'Source' },
  { value: 'beneficiary', label: 'Beneficiary' },
]

const navigation = [
  { to: '/', label: 'Overview', roles: ['Admin', 'HOD'] },
  { to: '/employees', label: 'Employees', roles: ['Admin', 'HOD'] },
  { to: '/payroll', label: 'Payroll', roles: ['Admin', 'HOD'] },
  { to: '/departments', label: 'Departments', roles: ['Admin'] },
]

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const { mode, setMode } = useViewMode()
  
  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(user?.role)
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2)?.toUpperCase() ?? 'US'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex lg:items-stretch">
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800/60 bg-slate-900/90 backdrop-blur-md transition-transform duration-300 ease-in-out',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-800/60 px-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-lg font-semibold text-emerald-300">
            {initials}
          </span>
          <div>
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="text-base font-semibold text-slate-50">{user?.name ?? user?.email}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-4 py-6 text-sm">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center justify-between rounded-xl px-4 py-3 font-medium transition',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100',
                ].join(' ')
              }
              onClick={() => setMobileNavOpen(false)}
            >
              <span>{item.label}</span>
              <span className="text-xs uppercase tracking-widest text-slate-500">{item.to === '/' ? 'overview' : ''}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-6 pb-6">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/90 px-4 py-4 backdrop-blur">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 shadow-sm shadow-black/40 transition hover:border-slate-700 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 lg:hidden"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-expanded={mobileNavOpen}
          >
            <span className="text-lg">{mobileNavOpen ? '×' : '☰'}</span>
            Menu
          </button>

          <div className="ml-auto flex items-center gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-1 rounded-full border border-slate-800/70 bg-slate-950/70 p-1 shadow-inner shadow-black/40">
              {MODE_OPTIONS.map((option) => {
                const isActive = option.value === mode
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    aria-pressed={isActive}
                    className={[
                      'rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70',
                      isActive
                        ? 'bg-emerald-400/90 text-slate-900 shadow-lg shadow-emerald-900/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            <div className="hidden text-right sm:block">
              <p className="font-medium text-slate-200">{user?.name ?? user?.email}</p>
              <p className="text-xs uppercase tracking-wide text-emerald-300/80">
                {user?.role === 'Admin' ? 'Administrator' : user?.role ?? 'Member'}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500/15 text-base font-semibold text-emerald-300">
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 bg-slate-950/95 px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


