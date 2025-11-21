import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'

export default function NonPayrollProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
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
    async function fetchProducts() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getNonPayrollProducts(token)
        if (isMounted) {
          setProducts(response.data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message ?? 'Unable to load product data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchProducts()
    return () => {
      isMounted = false
    }
  }, [token])

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-400">Loading product contributions…</p>
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

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Non-payroll</p>
        <h1 className="text-3xl font-semibold text-slate-50">Product allocations</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Understand how contractors, vendors, and interns contribute to Academy, Intensive, and NIAT products. Department
          breakdowns reveal the cost and output mix across teams.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/70">Product</p>
              <h2 className="text-2xl font-semibold text-slate-50">{product.productName}</h2>
              <p className="text-xs text-slate-500">Output score {product.outputScore.toFixed(1)}</p>
            </div>

            <div className="space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Contractors</span>
                <span>{currencyFormatter.format(product.contractorCosts)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vendors</span>
                <span>{currencyFormatter.format(product.vendorCosts)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Interns</span>
                <span>{currencyFormatter.format(product.internCosts)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Department breakdown</p>
              <div className="mt-2 space-y-2 text-xs text-slate-300">
                {product.departmentBreakdown.length === 0 ? (
                  <p className="text-slate-500">No department level data available.</p>
                ) : (
                  product.departmentBreakdown.map((entry) => (
                    <div key={`${product.id}-${entry.department?._id || entry.department}`} className="rounded-xl bg-slate-950/70 px-3 py-2">
                      <p className="font-semibold text-slate-100">{entry.department?.name ?? 'Department'}</p>
                      <p className="text-slate-400">
                        {currencyFormatter.format(entry.contractorCosts + entry.vendorCosts + entry.internCosts)}
                      </p>
                      <p className="text-slate-500">Output score {entry.outputScore.toFixed(1)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

