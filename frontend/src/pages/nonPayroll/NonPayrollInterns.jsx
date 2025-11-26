import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'

export default function NonPayrollInternsPage() {
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
    async function fetchInterns() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getNonPayrollInterns(token)
        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message ?? 'Unable to load interns.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchInterns()
    return () => {
      isMounted = false
    }
  }, [token])

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading intern metrics…</p>
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
        <h1 className="text-3xl font-semibold text-slate-50">Intern & trainee program</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Review intern progress, mentor assignments, and contributions to products. Department heads see their assigned
          interns, and admins view the full cohort.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Interns</p>
          <p className="mt-3 text-2xl font-semibold text-slate-50">{data.summary.interns}</p>
        </article>
        <article className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Total stipend</p>
          <p className="mt-3 text-2xl font-semibold text-slate-50">{currencyFormatter.format(data.summary.totalStipend)}</p>
        </article>
        <article className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Avg tasks</p>
          <p className="mt-3 text-2xl font-semibold text-slate-50">{data.summary.averageTasks.toFixed(1)}</p>
          <p className="mt-1 text-xs text-slate-400">Per intern</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-lg font-semibold text-slate-50">Product allocation</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {data.productStats.map((product) => (
            <div key={product.product} className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4 text-sm">
              <p className="font-semibold text-slate-100">{product.product}</p>
              <p className="mt-1 text-slate-400">{product.count} intern{product.count === 1 ? '' : 's'}</p>
              <p className="text-xs text-slate-500">
                Stipend {currencyFormatter.format(product.stipend)} · Avg rating {product.avgPerformance.toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-3xl border border-slate-800/70 bg-slate-950/40">
        <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-200">
          <thead className="bg-slate-900/50 text-xs uppercase tracking-[0.3em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Mentor</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold text-right">Tasks</th>
              <th className="px-4 py-3 font-semibold text-right">Performance</th>
              <th className="px-4 py-3 font-semibold text-right">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.interns.map((intern) => (
              <tr key={intern._id} className="bg-slate-950/30">
                <td className="px-4 py-3 font-semibold text-slate-100">{intern.name}</td>
                <td className="px-4 py-3 text-slate-400">{intern.department?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400">{intern.mentor ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400">{intern.productAssigned}</td>
                <td className="px-4 py-3 text-right text-slate-100">{intern.tasksCompleted ?? 0}</td>
                <td className="px-4 py-3 text-right text-emerald-300">{intern.performanceRating?.toFixed(1) ?? '—'}</td>
                <td className="px-4 py-3 text-right text-slate-100">{intern.progress ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  )
}

