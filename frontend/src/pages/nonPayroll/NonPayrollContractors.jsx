import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
]

function SummaryCard({ label, value, helper }) {
  return (
    <article className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-50">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </article>
  )
}

export default function NonPayrollContractorsPage() {
  const { token, user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }),
    []
  )

  useEffect(() => {
    let isMounted = true
    async function fetchContractors() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getNonPayrollContractors(token, {
          status: statusFilter || undefined,
        })
        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message ?? 'Unable to load contractors.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchContractors()
    return () => {
      isMounted = false
    }
  }, [token, statusFilter])

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading contractor metrics…</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-800/40" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-6 text-center text-red-100">
        <p className="font-semibold">{error}</p>
      </section>
    )
  }

  if (!data) {
    return null
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Non-payroll</p>
        <h1 className="text-3xl font-semibold text-slate-50">Contractor impact</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Track contractor effectiveness, monthly hours, and departmental spend. HODs see only their department data while
          administrators can filter across the organisation.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-4 sm:flex-row sm:items-end">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-500">
          Showing {data.contractors.length} contractor{data.contractors.length === 1 ? '' : 's'}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Active contractors" value={data.summary.headcount} helper="Current filters" />
        <SummaryCard label="Hours logged (month)" value={data.summary.totalHours} helper="hrs" />
        <SummaryCard label="Spend" value={currencyFormatter.format(data.summary.totalSpend)} helper="Approx. monthly" />
        <SummaryCard
          label="Avg. efficiency"
          value={`${data.summary.averageEfficiency.toFixed(1)}%`}
          helper="Output ÷ cost"
        />
      </section>

      {user?.role === 'Admin' && data.departmentComparison.length > 0 ? (
        <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-lg font-semibold text-slate-50">Department efficiency</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {data.departmentComparison.map((dept) => (
              <div key={dept.name} className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <p className="font-semibold text-slate-100">{dept.name}</p>
                  <p>
                    {currencyFormatter.format(dept.spend)}
                    <span className="text-xs text-slate-500"> / month</span>
                  </p>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {dept.headcount} contractor{dept.headcount === 1 ? '' : 's'} · Efficiency{' '}
                  {dept.efficiency.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-3xl border border-slate-800/70 bg-slate-950/40">
        <table className="min-w-full divide-y divide-slate-800/70 text-left text-sm text-slate-200">
          <thead className="bg-slate-900/50 text-xs uppercase tracking-[0.3em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold text-right">Hours</th>
              <th className="px-4 py-3 font-semibold text-right">Cost</th>
              <th className="px-4 py-3 font-semibold text-right">Output</th>
              <th className="px-4 py-3 font-semibold text-right">Efficiency</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.contractors.map((contractor) => (
              <tr key={contractor._id} className="bg-slate-950/30">
                <td className="px-4 py-3 font-semibold text-slate-100">{contractor.name}</td>
                <td className="px-4 py-3 text-slate-400">{contractor.role ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400">{contractor.department?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right text-slate-100">{contractor.hoursWorked ?? 0}</td>
                <td className="px-4 py-3 text-right text-slate-100">
                  {currencyFormatter.format(contractor.monthlyCost || 0)}
                </td>
                <td className="px-4 py-3 text-right text-slate-100">{contractor.outputDelivered ?? '—'}</td>
                <td className="px-4 py-3 text-right text-emerald-300">
                  {contractor.efficiencyScore?.toFixed(1) ?? '—'}%
                </td>
                <td className="px-4 py-3 text-slate-100">
                  <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                    {contractor.status ?? 'active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  )
}

