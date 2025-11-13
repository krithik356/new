import { useEffect, useMemo, useState } from 'react'

import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

function formatCycle(value) {
  if (!value) return 'Default cycle'
  return value
    .toString()
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ContributionsPage() {
  const { token, user } = useAuth()
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cycleFilter, setCycleFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [limitedView, setLimitedView] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadContributions() {
      setLoading(true)
      setError(null)
      setLimitedView(false)

      try {
        const response = await apiClient.getContributions(token)
        if (!cancelled) {
          setContributions(response.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 403 && user?.department?.id) {
            try {
              const departmentResponse = await apiClient.getContributionByDepartment(token, user.department.id)
              setLimitedView(true)
              setContributions(departmentResponse.data ? [departmentResponse.data] : [])
            } catch (innerError) {
              setError(innerError?.message ?? 'Unable to load contributions.')
              setContributions([])
            }
          } else {
            setError(err?.message ?? 'Unable to load contributions.')
            setContributions([])
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadContributions()

    return () => {
      cancelled = true
    }
  }, [token, user?.department?.id])

  const cycles = useMemo(() => {
    return Array.from(new Set(contributions.map((item) => item.cycle ?? 'default'))).sort()
  }, [contributions])

  const departments = useMemo(() => {
    return Array.from(
      new Map(
        contributions
          .filter((item) => item.department)
          .map((item) => [
            item.department.id ?? item.department._id,
            item.department.name ?? item.department.title ?? 'Department',
          ])
      ),
      ([id, name]) => ({ id, name })
    ).sort((a, b) => a.name.localeCompare(b.name))
  }, [contributions])

  const filteredContributions = useMemo(() => {
    return contributions.filter((contribution) => {
      const matchesCycle = cycleFilter === 'all' || (contribution.cycle ?? 'default') === cycleFilter
      const matchesDepartment =
        departmentFilter === 'all' ||
        (contribution.department && (contribution.department.id ?? contribution.department._id) === departmentFilter)

      return matchesCycle && matchesDepartment
    })
  }, [contributions, cycleFilter, departmentFilter])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Performance</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Contributions</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Track contribution submissions across cycles, view departmental performance, and drill into individual scores.
        </p>
      </header>

      {limitedView ? (
        <div className="rounded-3xl border border-blue-500/40 bg-blue-500/10 px-5 py-4 text-sm text-blue-100">
          You can only view contributions submitted for your department.
        </div>
      ) : null}

      <div className="grid gap-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor="cycle">
            Cycle
          </label>
          <select
            id="cycle"
            value={cycleFilter}
            onChange={(event) => setCycleFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="all">All cycles</option>
            {cycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {formatCycle(cycle)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor="department-filter">
            Department
          </label>
          <select
            id="department-filter"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="all">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-10 text-center text-red-100">
          <h2 className="text-xl font-semibold">Unable to load contributions</h2>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <SkeletonCards count={6} />
          ) : filteredContributions.length === 0 ? (
            <p className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">
              No contributions match your filters yet.
            </p>
          ) : (
            filteredContributions.map((contribution) => (
              <article
                key={contribution.id ?? contribution._id ?? `${contribution.department?._id}-${contribution.cycle}`}
                className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30 transition hover:border-emerald-500/40 hover:bg-slate-900"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Department</p>
                      <p className="mt-1 text-lg font-semibold text-slate-50">
                        {contribution.department?.name ?? 'Department contribution'}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                      {formatCycle(contribution.cycle ?? 'default')}
                    </span>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                    <Metric label="Academy" value={contribution.academy} />
                    <Metric label="Intensive" value={contribution.intensive} />
                    <Metric label="NIAT" value={contribution.niat} />
                  </div>
                  {contribution.remarks ? (
                    <p className="rounded-2xl bg-slate-950/60 px-4 py-3 text-xs text-slate-400">{contribution.remarks}</p>
                  ) : null}
                </div>
                <footer className="flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <p className="uppercase tracking-[0.35em] text-slate-500">Submitted by</p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                      {contribution.submittedBy?.name ?? 'Unknown'}
                    </p>
                  </div>
                  <p>{contribution.submittedAt ? new Date(contribution.submittedAt).toLocaleString() : '—'}</p>
                </footer>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-100">{value ?? '—'}</p>
    </div>
  )
}

function SkeletonCards({ count }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="h-56 animate-pulse rounded-3xl bg-slate-800/40"
        />
      ))}
    </>
  )
}


