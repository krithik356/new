import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'
import YearSelector from '../../components/YearSelector.jsx'

const MONTH_LABELS = [
  '01:January',
  '02:February',
  '03:March',
  '04:April',
  '05:May',
  '06:June',
  '07:July',
  '08:August',
  '09:September',
  '10:October',
  '11:November',
  '12:December',
]

export default function NonPayrollSpendEfficiencyPage() {
  const { token, user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [monthFilter, setMonthFilter] = useState('all')
  const [availableYears, setAvailableYears] = useState([])

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getNonPayrollSpendEfficiency(token, {
          year: yearFilter,
          month: monthFilter,
        })
        if (isMounted) {
          const years = (response.data.availableYears ?? []).map((year) => Number(year))
          setAvailableYears(years)
          if (years.length > 0 && !years.includes(Number(yearFilter))) {
            setYearFilter(years[0])
            return
          }
          setData(response.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message ?? 'Unable to load spend and efficiency data.')
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
  }, [token, yearFilter, monthFilter])

  const monthOptions = useMemo(
    () => [
      { value: 'all', label: 'All months' },
      ...MONTH_LABELS.map((entry) => {
        const [value, label] = entry.split(':')
        return { value, label }
      }),
    ],
    []
  )

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-8 text-sm text-slate-400">
        Loading spend analytics…
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

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })

  const yearOptions = availableYears.length > 0 ? availableYears : [yearFilter]

  const filterControls = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
        Month
        <select
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="mt-1 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <YearSelector value={yearFilter} options={yearOptions} onChange={setYearFilter} />
    </div>
  )

  if (user?.role === 'HOD') {
    const hasRows = data.trend.length > 0
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Non-payroll</p>
          <h1 className="text-3xl font-semibold text-slate-50">Department spend trend</h1>
          <p className="max-w-3xl text-sm text-slate-400">
            Track spend and efficiency for the selected month or the entire year in your department.
          </p>
        </header>

        {filterControls}

        <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
          {hasRows ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2 text-right">Spend</th>
                    <th className="px-3 py-2 text-right">Efficiency</th>
                    <th className="px-3 py-2 text-right">Contractors</th>
                    <th className="px-3 py-2 text-right">Vendors</th>
                    <th className="px-3 py-2 text-right">Interns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.trend.map((row) => (
                    <tr key={row.month}>
                      <td className="px-3 py-3 font-semibold text-slate-100">{row.month}</td>
                      <td className="px-3 py-3 text-right text-slate-200">{formatter.format(row.spend)}</td>
                      <td className="px-3 py-3 text-right text-emerald-300">{row.efficiency?.toFixed(1) ?? '—'}%</td>
                      <td className="px-3 py-3 text-right text-slate-200">{formatter.format(row.split.contractors)}</td>
                      <td className="px-3 py-3 text-right text-slate-200">{formatter.format(row.split.vendors)}</td>
                      <td className="px-3 py-3 text-right text-slate-200">{formatter.format(row.split.interns)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No spend data for this selection.</p>
          )}
        </section>
      </section>
    )
  }

  const hasTrend = data.trend.length > 0
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Non-payroll</p>
        <h1 className="text-3xl font-semibold text-slate-50">Spend & efficiency</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Administrators can compare department efficiency, watch monthly trends, and quickly identify budget overshoots.
        </p>
      </header>

      {filterControls}

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-lg font-semibold text-slate-50">Department comparison</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2 text-right">Spend</th>
                <th className="px-3 py-2 text-right">Avg efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.departmentEfficiency.map((dept) => (
                <tr key={dept.name}>
                  <td className="px-3 py-3 font-semibold text-slate-100">{dept.name}</td>
                  <td className="px-3 py-3 text-right">{formatter.format(dept.spend)}</td>
                  <td className="px-3 py-3 text-right text-emerald-300">
                    {dept.averageEfficiency?.toFixed(1) ?? '—'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-lg font-semibold text-slate-50">Trend</h3>
        {hasTrend ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.3em] text-slate-500">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2 text-right">Spend</th>
                  <th className="px-3 py-2 text-right">Avg efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.trend.map((row) => (
                  <tr key={row.month}>
                    <td className="px-3 py-3 font-semibold text-slate-100">{row.month}</td>
                    <td className="px-3 py-3 text-right">{formatter.format(row.spend)}</td>
                    <td className="px-3 py-3 text-right text-emerald-300">
                      {row.averageEfficiency?.toFixed(1) ?? '—'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No trend data for this selection.</p>
        )}
      </section>
    </section>
  )
}

