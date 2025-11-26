import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'

function StatCard({ title, value, helper }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 shadow-inner shadow-black/20">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-50">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </article>
  )
}

function ProgressBar({ label, value, total }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  )
}

export default function NonPayrollOverviewPage() {
  const { token, user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const formattedSplitTotal = useMemo(() => {
    if (!data) return 0
    return (data.split.contractors || 0) + (data.split.vendors || 0) + (data.split.interns || 0)
  }, [data])

  useEffect(() => {
    let isMounted = true
    async function load() {
      if (user?.role !== 'Admin') {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getNonPayrollOverview(token)
        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message ?? 'Unable to load non-payroll overview.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [token, user?.role])

  if (user?.role !== 'Admin') {
    return (
      <section className="rounded-3xl border border-amber-500/40 bg-amber-500/10 px-6 py-8 text-center text-amber-100">
        <h2 className="text-xl font-semibold">Restricted view</h2>
        <p className="mt-2 text-sm">Only administrators can view the company-wide non-payroll overview.</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading non-payroll insights…</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
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

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Non-payroll</p>
        <h1 className="text-3xl font-semibold text-slate-50">Company-wide overview</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Monitor monthly and year-to-date non-payroll investment, track vendor and contractor performance, and stay ahead of
          high-risk contracts.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Monthly spend" value={currencyFormatter.format(data.totals.monthlySpend)} helper="Current month" />
        <StatCard title="Year-to-date spend" value={currencyFormatter.format(data.totals.ytdSpend)} helper="Financial year" />
        <StatCard title="Active resources" value={`${data.counts.contractors + data.counts.vendors + data.counts.interns}`} helper="Contractors · Vendors · Interns" />
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/50 p-4 shadow-inner shadow-black/30">
        <h2 className="text-lg font-semibold text-slate-50">Spend split</h2>
        <p className="text-sm text-slate-400">Contractors vs vendors vs interns</p>
        <div className="mt-4 space-y-3">
          <ProgressBar label="Contractors" value={data.split.contractors} total={formattedSplitTotal} />
          <ProgressBar label="Vendors" value={data.split.vendors} total={formattedSplitTotal} />
          <ProgressBar label="Interns" value={data.split.interns} total={formattedSplitTotal} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">Department spend</h3>
            <p className="text-sm text-slate-400">Top spending departments YTD</p>
          </div>
          <div className="space-y-3">
            {data.departmentSpend.slice(0, 6).map((dept) => (
              <div key={dept.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/30 p-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">{dept.name}</span>
                  <span>{currencyFormatter.format(dept.spend)}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500/70"
                    style={{
                      width: `${Math.min((dept.spend / data.totals.ytdSpend) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">High-risk resources</h3>
            <p className="text-sm text-slate-400">Vendors or contractors flagged for review</p>
          </div>
          <div className="space-y-3">
            {data.highRiskResources.length === 0 ? (
              <p className="text-sm text-slate-400">No active risk alerts.</p>
            ) : (
              data.highRiskResources.map((risk) => (
                <div
                  key={risk._id}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100"
                >
                  <p className="font-semibold text-red-50">{risk.description}</p>
                  <p className="text-xs text-red-200">
                    {risk.department?.name ?? 'Unassigned'} · Due {risk.dueDate ? new Date(risk.dueDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-lg font-semibold text-slate-50">Top vendors by spend</h3>
          <div className="mt-3 divide-y divide-slate-800/60">
            {data.topVendors.map((vendor) => (
              <div key={vendor._id} className="space-y-1 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-100">{vendor.name}</p>
                  <p className="text-slate-300">{currencyFormatter.format(vendor.monthlyCost || 0)}</p>
                </div>
                <p className="text-xs text-slate-500">{vendor.category}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-lg font-semibold text-slate-50">Top contractors by efficiency</h3>
          <div className="mt-3 divide-y divide-slate-800/60">
            {data.topContractors.map((contractor) => (
              <div key={contractor._id} className="space-y-1 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-100">{contractor.name}</p>
                    <p className="text-xs text-slate-500">{contractor.department?.name ?? 'Unassigned'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {contractor.efficiencyScore?.toFixed(1) ?? '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-lg font-semibold text-slate-50">Contract expiry alerts</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-3">
            <p className="text-sm font-semibold text-slate-200">Contractors</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.contractAlerts.contractors.length === 0 ? (
                <li className="text-xs text-slate-500">No expiries in the next 45 days.</li>
              ) : (
                data.contractAlerts.contractors.map((item) => (
                  <li key={item.id} className="rounded-xl bg-slate-900/80 px-3 py-2">
                    <p className="font-semibold text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      Ends {new Date(item.endsOn).toLocaleDateString()} · {item.department}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-3">
            <p className="text-sm font-semibold text-slate-200">Vendors</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.contractAlerts.vendors.length === 0 ? (
                <li className="text-xs text-slate-500">No expiries in the next 60 days.</li>
              ) : (
                data.contractAlerts.vendors.map((item) => (
                  <li key={item.id} className="rounded-xl bg-slate-900/80 px-3 py-2">
                    <p className="font-semibold text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.category} · Ends {new Date(item.endsOn).toLocaleDateString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>
    </section>
  )
}

