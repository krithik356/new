import { useEffect, useState } from 'react'

import { apiClient } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'

export default function NonPayrollContractsRisksPage() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getNonPayrollContractsRisks(token)
        if (isMounted) {
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message ?? 'Unable to load contract risks.')
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
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-8 text-sm text-slate-400">
        Loading contracts & risks…
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
        <h1 className="text-3xl font-semibold text-slate-50">Contracts</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Stay ahead of upcoming contractor and vendor expiries for your department.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-lg font-semibold text-slate-50">Upcoming contractor expiries</h3>
          {data.upcomingExpiries.contractors.length === 0 ? (
            <p className="text-sm text-slate-500">No expiries in the next 60 days.</p>
          ) : (
            data.upcomingExpiries.contractors.map((contractor) => (
              <div key={contractor.id} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-3 text-sm">
                <p className="font-semibold text-slate-100">{contractor.name}</p>
                <p className="text-xs text-slate-500">
                  {contractor.department} · Ends {contractor.endsOn ? new Date(contractor.endsOn).toLocaleDateString() : '—'}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="space-y-3 rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-lg font-semibold text-slate-50">Upcoming vendor expiries</h3>
          {data.upcomingExpiries.vendors.length === 0 ? (
            <p className="text-sm text-slate-500">No vendor expiries in the next 90 days.</p>
          ) : (
            data.upcomingExpiries.vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-3 text-sm">
                <p className="font-semibold text-slate-100">{vendor.name}</p>
                <p className="text-xs text-slate-500">
                  {vendor.category} · Ends {vendor.endsOn ? new Date(vendor.endsOn).toLocaleDateString() : '—'}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  )
}

