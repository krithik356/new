import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  if (typeof value !== 'number') return currencyFormatter.format(0)
  return currencyFormatter.format(value)
}

function getLast5Months() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed
  
  const months = []
  for (let i = 4; i >= 0; i--) {
    const monthIndex = currentMonth - i
    let year = currentYear
    let month = monthIndex
    
    if (month < 0) {
      month += 12
      year -= 1
    }
    
    months.push({
      month: MONTH_NAMES[month],
      year,
      monthIndex: month,
    })
  }
  
  return months
}

function aggregateContributions(contributions = []) {
  const base = {
    total: contributions.length,
    totals: {
      academy: 0,
      intensive: 0,
      niat: 0,
    },
  }

  return contributions.reduce((acc, item) => {
    acc.totals.academy += Number(item.academy ?? 0)
    acc.totals.intensive += Number(item.intensive ?? 0)
    acc.totals.niat += Number(item.niat ?? 0)
    return acc
  }, base)
}

const DONUT_COLORS = ['#34d399', '#60a5fa', '#f472b6']

function buildProductBreakdown(contributions = []) {
  const totals = contributions.reduce(
    (acc, entry) => {
      acc.academy += Number(entry.academy ?? 0)
      acc.intensive += Number(entry.intensive ?? 0)
      acc.niat += Number(entry.niat ?? 0)
      return acc
    },
    { academy: 0, intensive: 0, niat: 0 }
  )

  const totalValue = totals.academy + totals.intensive + totals.niat
  if (totalValue === 0) {
    return []
  }

  const products = [
    { product: 'Academy', value: totals.academy },
    { product: 'Intensive', value: totals.intensive },
    { product: 'NIAT', value: totals.niat },
  ]

  let accumulated = 0
  return products.map((item, index) => {
    let percentage
    if (index === products.length - 1) {
      percentage = Math.max(0, 100 - accumulated)
    } else {
      percentage = Math.round((item.value / totalValue) * 100)
      accumulated += percentage
    }
    return {
      ...item,
      percentage,
    }
  })
}

export default function DashboardPage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [contributions, setContributions] = useState([])
  const [generatingReport, setGeneratingReport] = useState(false)
  const [generatingDeptSheet, setGeneratingDeptSheet] = useState(null) // Track which department sheet is being generated
  const [monthlyCosts, setMonthlyCosts] = useState([])
  const [monthlyCostsLoading, setMonthlyCostsLoading] = useState(false)
  
  // Filter employees and contributions for HOD users
  const filteredEmployees = user?.role === 'HOD' && user?.department?.id
    ? employees.filter(emp => emp.department && (emp.department.id === user.department.id || emp.department._id === user.department.id))
    : employees
  
  const filteredContributions = user?.role === 'HOD' && user?.department?.id
    ? contributions.filter(contrib => contrib.department && (contrib.department.id === user.department.id || contrib.department._id === user.department.id))
    : contributions

  useEffect(() => {
    let isCancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      setAlerts([])

      const newAlerts = []

      try {
        const [employeesResult, contributionsResult, departmentsResult] = await Promise.allSettled([
          apiClient.getEmployees(token),
          apiClient.getContributions(token),
          apiClient.getDepartments(token),
        ])

        if (!isCancelled) {
          if (employeesResult.status === 'fulfilled') {
            setEmployees(employeesResult.value?.data ?? [])
          } else {
            setEmployees([])
            const errorMsg = employeesResult.reason?.message ?? 'Unable to load employees.'
            // Don't show error alert if it's just a missing department for HOD
            if (!(user?.role === 'HOD' && !user?.department && errorMsg.includes('department'))) {
              newAlerts.push({
                type: 'error',
                title: 'Employees',
                message: errorMsg,
              })
            } else {
              newAlerts.push({
                type: 'info',
                title: 'Employees',
                message: 'Please contact an administrator to assign your department.',
              })
            }
          }

          if (contributionsResult.status === 'fulfilled') {
            setContributions(contributionsResult.value?.data ?? [])
          } else {
            if (contributionsResult.reason instanceof ApiError && contributionsResult.reason.status === 403) {
              newAlerts.push({
                type: 'info',
                title: 'Contributions',
                message: 'You do not have permission to view all contributions. Showing personalised insight only.',
              })
            } else {
              newAlerts.push({
                type: 'error',
                title: 'Contributions',
                message: contributionsResult.reason?.message ?? 'Unable to load contributions.',
              })
            }
            setContributions([])
          }

          if (departmentsResult.status === 'fulfilled') {
            setDepartments(departmentsResult.value?.data ?? [])
          } else {
            if (departmentsResult.reason instanceof ApiError && departmentsResult.reason.status === 403) {
              newAlerts.push({
                type: 'info',
                title: 'Departments',
                message: 'Only administrators can view all departments.',
              })
            } else {
              newAlerts.push({
                type: 'error',
                title: 'Departments',
                message: departmentsResult.reason?.message ?? 'Unable to load departments.',
              })
            }
            setDepartments([])
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err?.message ?? 'Unexpected error while fetching dashboard data.')
        }
      } finally {
        if (!isCancelled) {
          setAlerts(newAlerts)
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [token])

  // Fetch monthly costs for HOD users (last 5 months)
  useEffect(() => {
    let isCancelled = false

    async function fetchMonthlyCosts() {
      if (user?.role !== 'HOD' || !user?.department?.id) {
        setMonthlyCosts([])
        return
      }

      setMonthlyCostsLoading(true)
      const last5Months = getLast5Months()
      const costsData = []

      try {
        for (const { month, year } of last5Months) {
          try {
            const response = await apiClient.getMonthlySalaries(token, {
              month,
              year,
            })
            const salaries = response.data ?? []
            const totalCost = salaries.reduce((sum, entry) => sum + (entry.amount ?? 0), 0)
            costsData.push({
              month,
              year,
              totalCost,
            })
          } catch (err) {
            // If a month fails, still add it with 0 cost
            costsData.push({
              month,
              year,
              totalCost: 0,
            })
          }
        }

        if (!isCancelled) {
          setMonthlyCosts(costsData)
        }
      } catch (err) {
        if (!isCancelled) {
          setMonthlyCosts([])
        }
      } finally {
        if (!isCancelled) {
          setMonthlyCostsLoading(false)
        }
      }
    }

    fetchMonthlyCosts()

    return () => {
      isCancelled = true
    }
  }, [token, user?.role, user?.department?.id])

  const contributionStats = aggregateContributions(filteredContributions)
  const recentPayrollUpdates = filteredContributions
    .slice()
    .sort(
      (a, b) =>
        new Date(b.submittedAt ?? b.updatedAt ?? 0) - new Date(a.submittedAt ?? a.updatedAt ?? 0)
    )
    .slice(0, 4)
  const currentDepartment =
    user?.department && departments.length === 0
      ? user.department
      : departments.find((dept) => dept.id === user?.department?.id) ?? user?.department ?? null

  const hodProductContributions = useMemo(() => {
    if (user?.role !== 'HOD') {
      return []
    }
    return buildProductBreakdown(filteredContributions)
  }, [user?.role, filteredContributions])

  const hodProductChart = useMemo(() => {
    if (hodProductContributions.length === 0) {
      return null
    }
    let currentPercent = 0
    const segments = hodProductContributions.map((item, index) => {
      const color = DONUT_COLORS[index % DONUT_COLORS.length]
      const startDeg = currentPercent * 3.6
      const endDeg = (currentPercent + item.percentage) * 3.6
      currentPercent += item.percentage
      return {
        ...item,
        color,
        startDeg,
        endDeg,
      }
    })
    const gradientStops = segments
      .map((segment) => `${segment.color} ${segment.startDeg}deg ${segment.endDeg}deg`)
      .join(', ')
    return {
      segments,
      gradient: `conic-gradient(${gradientStops})`,
    }
  }, [hodProductContributions])

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.45em] text-emerald-300/80">Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50 sm:text-4xl">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Your central hub for monitoring employee contributions, departmental performance, and upcoming actions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {user?.role === 'Admin' && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setGeneratingReport(true)
                    try {
                      await apiClient.exportDepartmentReport(token)
                      setError(null)
                    } catch (err) {
                      setError(err?.message ?? 'Failed to generate report. Please try again.')
                    } finally {
                      setGeneratingReport(false)
                    }
                  }}
                  disabled={generatingReport || generatingDeptSheet !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/60 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generatingReport ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>📊</span>
                      Generate Report
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setGeneratingDeptSheet('Tech')
                    try {
                      await apiClient.exportDepartmentEmployeeSheet(token, 'Tech')
                      setError(null)
                    } catch (err) {
                      setError(err?.message ?? 'Failed to generate Tech sheet. Please try again.')
                    } finally {
                      setGeneratingDeptSheet(null)
                    }
                  }}
                  disabled={generatingReport || generatingDeptSheet !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/60 bg-blue-500/20 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:border-blue-300 hover:bg-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generatingDeptSheet === 'Tech' ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>💻</span>
                      Tech Sheet
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setGeneratingDeptSheet('Design')
                    try {
                      await apiClient.exportDepartmentEmployeeSheet(token, 'Design')
                      setError(null)
                    } catch (err) {
                      setError(err?.message ?? 'Failed to generate Design sheet. Please try again.')
                    } finally {
                      setGeneratingDeptSheet(null)
                    }
                  }}
                  disabled={generatingReport || generatingDeptSheet !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-400/60 bg-purple-500/20 px-5 py-3 text-sm font-semibold text-purple-200 transition hover:border-purple-300 hover:bg-purple-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generatingDeptSheet === 'Design' ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>🎨</span>
                      Design Sheet
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setGeneratingDeptSheet('Marketing')
                    try {
                      await apiClient.exportDepartmentEmployeeSheet(token, 'Marketing')
                      setError(null)
                    } catch (err) {
                      setError(err?.message ?? 'Failed to generate Marketing sheet. Please try again.')
                    } finally {
                      setGeneratingDeptSheet(null)
                    }
                  }}
                  disabled={generatingReport || generatingDeptSheet !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-pink-400/60 bg-pink-500/20 px-5 py-3 text-sm font-semibold text-pink-200 transition hover:border-pink-300 hover:bg-pink-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generatingDeptSheet === 'Marketing' ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-pink-200 border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>📢</span>
                      Marketing Sheet
                    </>
                  )}
                </button>
              </>
            )}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-inner shadow-black/20">
            <p className="font-medium uppercase tracking-widest text-emerald-100/70">
              {user?.role === 'Admin' ? 'Administrator' : user?.role ?? 'Member'}
            </p>
            {user?.role === 'HOD' && user?.department ? (
              <p className="mt-1 text-xs text-emerald-100/60">
                Department • <strong className="font-semibold text-emerald-100">{user.department.name}</strong>
                {user.department.code ? ` (${user.department.code})` : ''}
              </p>
            ) : user?.role === 'HOD' && !user?.department ? (
              <p className="mt-1 text-xs text-yellow-200/80">
                ⚠️ No department assigned - Contact administrator
              </p>
            ) : currentDepartment ? (
              <p className="mt-1 text-xs text-emerald-100/60">
                Department • {currentDepartment.name}
                {currentDepartment.code ? ` (${currentDepartment.code})` : ''}
              </p>
            ) : user?.role === 'Admin' ? (
              <p className="mt-1 text-xs text-emerald-100/60">All departments</p>
            ) : (
              <p className="mt-1 text-xs text-emerald-100/60">No department assigned</p>
            )}
            </div>
          </div>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`${alert.title}-${index}`}
                className={[
                  'rounded-2xl border px-4 py-3 text-sm transition',
                  alert.type === 'error' && 'border-red-500/40 bg-red-500/10 text-red-200',
                  alert.type === 'info' && 'border-blue-500/40 bg-blue-500/10 text-blue-200',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <p className="font-semibold">{alert.title}</p>
                <p className="mt-1 text-xs text-current/80">{alert.message}</p>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-8 text-center text-red-100 shadow-inner shadow-black/30">
          <h2 className="text-xl font-semibold">We ran into a problem</h2>
          <p className="mt-2 text-sm text-red-200/80">{error}</p>
        </div>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <InsightCard
              title="Team members"
              value={loading ? '—' : filteredEmployees.length}
              helper={user?.role === 'HOD' && user?.department 
                ? `Active employees in ${user.department.name}` 
                : "Active employees in your view"}
            />
            <InsightCard
              title="Total contributions"
              value={loading ? '—' : contributionStats.total}
              helper="Submitted cycles on record"
            />
            <InsightCard
              title="Academy points"
              value={loading ? '—' : contributionStats.totals.academy}
              helper="Sum across all contributions"
            />
            {user?.role === 'Admin' && (
              <InsightCard
                title="Departments"
                value={loading ? '—' : departments.length || '—'}
                helper="Available for your role"
              />
            )}
          </section>
          <section className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Recent payroll updates</h2>
                    <p className="text-xs text-slate-500">Latest submissions impacting salary allocations.</p>
                  </div>
                  <Link
                    to="/payroll"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-800/80"
                  >
                    View payroll →
                  </Link>
                </header>

                <div className="mt-5 space-y-4">
                  {loading ? (
                    <SkeletonRows count={3} />
                  ) : recentPayrollUpdates.length === 0 ? (
                    <p className="rounded-2xl border border-slate-800/60 bg-slate-900/80 px-4 py-6 text-sm text-slate-400">
                      No payroll updates are available for your role yet.
                    </p>
                  ) : (
                    recentPayrollUpdates.map((entry) => {
                      const formattedDate = entry.submittedAt
                        ? new Date(entry.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'

                      return (
                        <article
                          key={entry.id ?? `${entry.department?._id ?? entry.department}-${entry.cycle ?? 'default'}`}
                          className="rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-4 shadow-sm shadow-black/20"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-100">
                                {entry.department?.name ?? 'Department update'}
                              </p>
                              <p className="text-xs uppercase tracking-widest text-emerald-300/70">
                                Cycle {entry.cycle ?? 'default'}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Submitted {formattedDate} · {entry.submittedBy?.name ?? 'Automated'}
                              </p>
                            </div>
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                              Payroll refresh
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                            <Metric label="Academy" value={`${entry.academy ?? '—'}%`} />
                            <Metric label="Intensive" value={`${entry.intensive ?? '—'}%`} />
                            <Metric label="NIAT" value={`${entry.niat ?? '—'}%`} />
                          </div>
                        </article>
                      )
                    })
                  )}
=======
          {user?.role === 'HOD' ? (
            <section className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Products</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-50">Contribution mix</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Share of Academy, Intensive, and NIAT contributions within your department.
                  </p>
                </div>
              </div>

              {hodProductContributions.length === 0 || !hodProductChart ? (
                <p className="mt-6 rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-6 text-sm text-slate-400">
                  No contribution data is available yet.
                </p>
              ) : (
                <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="relative mx-auto h-40 w-40">
                    <div
                      className="h-full w-full rounded-full border border-slate-800/60"
                      style={{ backgroundImage: hodProductChart.gradient }}
                      aria-hidden="true"
                    />
                    <div className="absolute inset-6 grid place-items-center rounded-full bg-slate-950 text-center">
                      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Total</p>
                      <p className="text-2xl font-semibold text-slate-50">100%</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {hodProductChart.segments.map((segment) => (
                      <div
                        key={segment.product}
                        className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: segment.color }}
                            aria-hidden="true"
                          />
                          <div>
                            <p className="font-semibold text-slate-100">{segment.product}</p>
                            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Share</p>
                          </div>
                        </div>
                        <span className="text-base font-semibold text-emerald-200">{segment.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : null}

          <section className="space-y-6">
            <div className="space-y-6">
              {user?.role === 'HOD' ? (
                <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
                  <header className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">Latest costs</h2>
                      <p className="text-xs text-slate-500">Total salary costs for the last 5 months.</p>
                    </div>
                    <Link
                      to="/payroll"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-800/80"
                    >
                      View all →
                    </Link>
                  </header>

                  <div className="mt-5 space-y-4">
                    {monthlyCostsLoading || loading ? (
                      <SkeletonRows count={5} />
                    ) : monthlyCosts.length === 0 ? (
                      <p className="rounded-2xl border border-slate-800/60 bg-slate-900/80 px-4 py-6 text-sm text-slate-400">
                        No salary data available for the last 5 months.
                      </p>
                    ) : (
                      monthlyCosts.map((costEntry) => (
                        <article
                          key={`${costEntry.month}-${costEntry.year}`}
                          className="rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-4 shadow-sm shadow-black/20"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-100">
                                {costEntry.month} {costEntry.year}
                              </p>
                              <p className="text-xs uppercase tracking-widest text-emerald-300/70">
                                Monthly Salary Cost
                              </p>
                            </div>
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                              {formatCurrency(costEntry.totalCost)}
                            </span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
                  <header className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">Latest contributions</h2>
                      <p className="text-xs text-slate-500">Most recent submissions appear first.</p>
                    </div>
                    <Link
                      to="/payroll"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-800/80"
                    >
                      View all →
                    </Link>
                  </header>

                  <div className="mt-5 space-y-4">
                    {loading ? (
                      <SkeletonRows count={3} />
                    ) : filteredContributions.length === 0 ? (
                      <p className="rounded-2xl border border-slate-800/60 bg-slate-900/80 px-4 py-6 text-sm text-slate-400">
                        No contributions are available for your role yet.
                      </p>
                    ) : (
                      filteredContributions.slice(0, 4).map((entry) => (
                        <article
                          key={entry.id ?? `${entry.department?._id ?? entry.department}-${entry.cycle ?? 'default'}`}
                          className="rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-4 shadow-sm shadow-black/20"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-100">
                                {entry.department?.name ?? 'Department contribution'}
                              </p>
                              <p className="text-xs uppercase tracking-widest text-emerald-300/70">
                                Cycle {entry.cycle ?? 'default'}
                              </p>
                            </div>
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                              {entry.submittedBy?.name ?? 'Submitted'}
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                            <Metric label="Academy" value={entry.academy} />
                            <Metric label="Intensive" value={entry.intensive} />
                            <Metric label="NIAT" value={entry.niat} />
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
    </div>
  )
}

function InsightCard({ title, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-50">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value ?? '—'}</p>
    </div>
  )
}

function SkeletonRows({ count }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="h-14 animate-pulse rounded-2xl bg-slate-800/40"
        />
      ))}
    </div>
  )
}

