import { useEffect, useMemo, useState } from 'react'

import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

export default function DepartmentsPage() {
  const { token, user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLimitedMessage, setShowLimitedMessage] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadDepartments() {
      setLoading(true)
      setError(null)
      setShowLimitedMessage(false)

      try {
        const response = await apiClient.getDepartments(token)
        if (!cancelled) {
          setDepartments(response.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 403) {
            setShowLimitedMessage(true)
            if (user?.department) {
              setDepartments([user.department])
            } else {
              setDepartments([])
            }
          } else {
            setError(err?.message ?? 'Unable to load departments.')
            setDepartments([])
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDepartments()

    return () => {
      cancelled = true
    }
  }, [token, user?.department])

  const stats = useMemo(() => {
    if (departments.length === 0) {
      return null
    }
    const total = departments.length
    const withHead = departments.filter((dept) => Boolean(dept.hod ?? dept.hodName)).length

    return {
      total,
      withHead,
      withoutHead: total - withHead,
    }
  }, [departments])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Structure</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Departments</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Stay informed about your organisation structure, see who leads each team, and identify departments that need
          attention.
        </p>
      </header>

      {showLimitedMessage ? (
        <div className="rounded-3xl border border-blue-500/40 bg-blue-500/10 px-5 py-4 text-sm text-blue-100">
          Only administrators can view all departments. Showing the department assigned to you instead.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-10 text-center text-red-100">
          <h2 className="text-xl font-semibold">Unable to load departments</h2>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Departments" value={loading ? '—' : stats?.total ?? 0} helper="Total units in view" />
            <StatCard
              title="With HOD assigned"
              value={loading ? '—' : stats?.withHead ?? 0}
              helper="Departments with a head"
            />
            <StatCard
              title="Needing attention"
              value={loading ? '—' : stats?.withoutHead ?? 0}
              helper="Departments without a designated head"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <SkeletonCards count={6} />
            ) : departments.length === 0 ? (
              <p className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">
                No department data available for your role.
              </p>
            ) : (
              departments.map((department) => (
                <article
                  key={department.id ?? department._id ?? department.name}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30 transition hover:border-emerald-500/40 hover:bg-slate-900"
                >
                  <header>
                    <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Department</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-50">{department.name}</h2>
                    {department.code ? (
                      <p className="mt-1 text-xs uppercase tracking-[0.45em] text-emerald-300/80">{department.code}</p>
                    ) : null}
                  </header>

                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Head of Department</p>
                      <p className="mt-1 text-base font-semibold text-slate-100">
                        {department.hod?.name ?? department.hodName ?? 'Unassigned'}
                      </p>
                      {department.hod?.email ? (
                        <p className="text-xs text-slate-500">{department.hod.email}</p>
                      ) : null}
                    </div>
                    {department.createdAt ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Created</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(department.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  )
}

function StatCard({ title, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-50">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
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
          className="h-48 animate-pulse rounded-3xl bg-slate-800/40"
        />
      ))}
    </>
  )
}


