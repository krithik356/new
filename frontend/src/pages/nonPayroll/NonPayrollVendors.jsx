import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'

export default function NonPayrollVendorsPage() {
  const { token } = useAuth()
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
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getNonPayrollVendors(token)
        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message ?? 'Unable to load vendor overview.')
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
  }, [token])

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading vendor insights…</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
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

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Non-payroll</p>
        <h1 className="text-3xl font-semibold text-slate-50">Vendor partnerships</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Review vendor performance, spend by category, and outstanding risks. HODs see vendors linked to their department.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Active vendors</p>
          <p className="mt-3 text-2xl font-semibold text-slate-50">{data.summary.vendors}</p>
        </article>
        <article className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Monthly spend</p>
          <p className="mt-3 text-2xl font-semibold text-slate-50">{currencyFormatter.format(data.summary.totalCost)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4 shadow-inner shadow-black/30">
        <h3 className="text-lg font-semibold text-slate-50">Spend by category</h3>
        <div className="mt-4 space-y-3">
          {data.costByCategory.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{item.name}</span>
                <span>{currencyFormatter.format(item.value)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-500/60"
                  style={{
                    width: `${Math.min((item.value / data.summary.totalCost) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-lg font-semibold text-slate-50">Performance leaderboard</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-200">
            <thead className="bg-slate-900/50 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Performance</th>
                <th className="px-4 py-3 font-semibold text-right">Monthly spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.performanceLeaderboard.map((vendor) => (
                <tr key={vendor.id} className="bg-slate-950/30">
                  <td className="px-4 py-3 font-semibold text-slate-100">{vendor.name}</td>
                  <td className="px-4 py-3 text-slate-400">{vendor.category}</td>
                  <td className="px-4 py-3 text-right text-emerald-300">{vendor.performanceScore}</td>
                  <td className="px-4 py-3 text-right text-slate-100">
                    {currencyFormatter.format(vendor.monthlyCost || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-lg font-semibold text-slate-50">Vendors</h3>
        <div className="mt-3 divide-y divide-slate-800/60">
          {data.vendors.map((vendor) => (
            <div key={vendor._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-100">{vendor.name}</p>
                <p className="text-xs text-slate-500">{vendor.category}</p>
                <p className="text-xs text-slate-500">
                  Departments:{' '}
                  {vendor.departmentsUsing?.map((dept) => dept.name).join(', ') || '—'}
                </p>
              </div>
              <div className="text-sm text-slate-300">
                <p>{currencyFormatter.format(vendor.monthlyCost || 0)}</p>
                <p className="text-xs text-slate-500">Monthly cost</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

