import { useEffect, useMemo, useState } from 'react'

import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const QUARTER_MONTH_MAP = {
  q1: ['January', 'February', 'March'],
  q2: ['April', 'May', 'June'],
  q3: ['July', 'August', 'September'],
  q4: ['October', 'November', 'December'],
}

const MONTH_DISPLAY_ORDER = [
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

function getMonthsForCycle(cycle) {
  const value = (cycle ?? '').toString().toLowerCase()
  if (value.includes('q1')) return QUARTER_MONTH_MAP.q1
  if (value.includes('q2')) return QUARTER_MONTH_MAP.q2
  if (value.includes('q3')) return QUARTER_MONTH_MAP.q3
  if (value.includes('q4')) return QUARTER_MONTH_MAP.q4
  if (value.includes('jan')) return ['January']
  if (value.includes('feb')) return ['February']
  if (value.includes('mar')) return ['March']
  if (value.includes('apr')) return ['April']
  if (value.includes('may')) return ['May']
  if (value.includes('jun')) return ['June']
  if (value.includes('jul')) return ['July']
  if (value.includes('aug')) return ['August']
  if (value.includes('sep')) return ['September']
  if (value.includes('oct')) return ['October']
  if (value.includes('nov')) return ['November']
  if (value.includes('dec')) return ['December']
  return ['January', 'February', 'March']
}

function formatCycle(value) {
  if (!value) return 'Default cycle'
  return value
    .toString()
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatCurrency(value) {
  if (typeof value !== 'number') return currencyFormatter.format(0)
  return currencyFormatter.format(value)
}

export default function PayrollPage() {
  const { token, user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [limitedView, setLimitedView] = useState(false)
  const [costSheetLoading, setCostSheetLoading] = useState(false)
  const [costSheetError, setCostSheetError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadEmployeesWithContributions() {
      setLoading(true)
      setError(null)
      setLimitedView(false)

      try {
        const response = await apiClient.getEmployeesWithContributions(token)
        if (!cancelled) {
          const employeesData = response.data ?? []
          setEmployees(employeesData)

          if (user?.role === 'HOD' && user?.department?.id) {
            setLimitedView(true)
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message)
          } else {
            setError(err?.message ?? 'Unable to load payroll data.')
          }
          setEmployees([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEmployeesWithContributions()

    return () => {
      cancelled = true
    }
  }, [token, user?.role, user?.department?.id])

  useEffect(() => {
    if (user?.role === 'HOD' && user?.department?.id) {
      setDepartmentFilter(user.department.id)
    }
  }, [user?.role, user?.department?.id])

  const employeesWithMonthlyContributions = useMemo(() => {
    return employees.map((employee) => {
      const monthlyContributions =
        employee.contributions?.flatMap((contribution) => {
          const months = getMonthsForCycle(contribution.cycle)
          return months.map((monthLabel) => ({
            ...contribution,
            monthLabel,
            monthKey: `${contribution._id || contribution.id || contribution.cycle}-${monthLabel}`,
          }))
        }) ?? []

      return { ...employee, monthlyContributions }
    })
  }, [employees])

  const availableMonths = useMemo(() => {
    const set = new Set()
    employeesWithMonthlyContributions.forEach((employee) => {
      employee.monthlyContributions.forEach((contribution) => {
        if (contribution.monthLabel) {
          set.add(contribution.monthLabel)
        }
      })
    })

    if (set.size === 0) {
      return QUARTER_MONTH_MAP.q1
    }

    return Array.from(set).sort(
      (a, b) =>
        MONTH_DISPLAY_ORDER.indexOf(a) - MONTH_DISPLAY_ORDER.indexOf(b)
    )
  }, [employeesWithMonthlyContributions])

  const departments = useMemo(() => {
    const map = new Map()
    employeesWithMonthlyContributions.forEach((employee) => {
      if (!employee.department) return
      const deptId = employee.department._id || employee.department.id
      if (!map.has(deptId)) {
        map.set(deptId, {
          id: deptId,
          name: employee.department.name,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [employeesWithMonthlyContributions])

  const employeesByDepartment = useMemo(() => {
    const grouped = new Map()
    employeesWithMonthlyContributions.forEach((employee) => {
      if (!employee.department) return
      const deptId = employee.department._id || employee.department.id
      if (!grouped.has(deptId)) {
        grouped.set(deptId, { id: deptId, name: employee.department.name, employees: [] })
      }
      grouped.get(deptId).employees.push(employee)
    })
    return Array.from(grouped.values())
  }, [employeesWithMonthlyContributions])

  const filteredEmployeesByDepartment = useMemo(() => {
    if (departmentFilter === 'all') {
      return employeesByDepartment
    }
    return employeesByDepartment.filter((dept) => dept.id === departmentFilter)
  }, [departmentFilter, employeesByDepartment])

  const employeesInScope = useMemo(() => {
    if (departmentFilter === 'all') {
      return employeesWithMonthlyContributions
    }
    return employeesWithMonthlyContributions.filter((employee) => {
      if (!employee.department) return false
      const deptId = employee.department._id || employee.department.id
      return deptId === departmentFilter
    })
  }, [departmentFilter, employeesWithMonthlyContributions])

  const totalCost = useMemo(
    () => employeesInScope.reduce((sum, employee) => sum + (employee.salary ?? 0), 0),
    [employeesInScope]
  )

  const averageSalary = employeesInScope.length
    ? totalCost / employeesInScope.length
    : 0

  const highestSalary = employeesInScope.reduce(
    (max, employee) => Math.max(max, employee.salary ?? 0),
    0
  )

  const monthToCycleMap = useMemo(() => {
    const map = new Map()
    employeesWithMonthlyContributions.forEach((employee) => {
      employee.monthlyContributions.forEach((contribution) => {
        if (contribution.monthLabel && contribution.cycle && !map.has(contribution.monthLabel)) {
          map.set(contribution.monthLabel, contribution.cycle)
        }
      })
    })
    return map
  }, [employeesWithMonthlyContributions])

  const handleGenerateCostSheet = async () => {
    setCostSheetError(null)

    const cycleParam = monthFilter === 'all' ? undefined : monthToCycleMap.get(monthFilter)
    if (monthFilter !== 'all' && !cycleParam) {
      setCostSheetError('No contributions found for the selected month.')
      return
    }

    if (user?.role === 'Admin' && departmentFilter === 'all') {
      setCostSheetError('Select a department to export its payroll.')
      return
    }

    setCostSheetLoading(true)
    try {
      if (user?.role === 'Admin') {
        const selectedDepartment = departments.find((dept) => dept.id === departmentFilter)
        if (!selectedDepartment) {
          setCostSheetError('Selected department could not be found.')
          return
        }
        await apiClient.exportDepartmentEmployeeSheet(
          token,
          selectedDepartment.name,
          cycleParam ? { cycle: cycleParam } : undefined
        )
      } else {
        await apiClient.exportDepartmentEmployeeContributions(
          token,
          cycleParam ? { cycle: cycleParam } : undefined
        )
      }
    } catch (err) {
      setCostSheetError(err?.message ?? 'Unable to download the cost sheet.')
    } finally {
      setCostSheetLoading(false)
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Payroll</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Cost & contribution overview</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-400">
          Track departmental spend and evaluate contribution performance month-by-month. Use the cost view for salary decisions and the contribution view to monitor impact.
        </p>
        {user?.role === 'HOD' && user?.department && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <p className="font-semibold">Viewing Department</p>
            <p className="mt-1 text-base font-bold text-emerald-100">
              {user.department.name}
              {user.department.code ? ` (${user.department.code})` : ''}
            </p>
          </div>
        )}
      </header>

      {limitedView && user?.role === 'HOD' ? (
        <div className="rounded-3xl border border-blue-500/40 bg-blue-500/10 px-5 py-4 text-sm text-blue-100">
          <p className="font-semibold">Department view</p>
          <p className="mt-1">
            You are viewing payroll data for <strong>{user?.department?.name ?? 'your department'}</strong>.
          </p>
        </div>
      ) : null}

      <section className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Cost centre</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-50">Salary impact</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex flex-col text-xs font-medium uppercase tracking-widest text-slate-500">
              Month
              <select
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                className="mt-1 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="all">All months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>

            {user?.role === 'Admin' && (
              <label className="flex flex-col text-xs font-medium uppercase tracking-widest text-slate-500">
                Department
                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="mt-1 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="all">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CostStat title="Total salary cost" value={formatCurrency(totalCost)} helper="Visible employees" />
          <CostStat title="Average salary" value={formatCurrency(Math.round(averageSalary))} helper="Per employee" />
          <CostStat title="Highest salary" value={formatCurrency(highestSalary)} helper="Top earner" />
          <CostStat
            title="Headcount"
            value={employeesInScope.length}
            helper={departmentFilter === 'all' ? 'Across all departments' : 'Filtered department'}
          />
        </div>

        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-4 shadow-inner shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">Cost sheet</p>
              <p className="text-xs text-slate-400">Download an Excel summary with salaries and totals.</p>
            </div>
            <button
              type="button"
              onClick={handleGenerateCostSheet}
              disabled={costSheetLoading}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {costSheetLoading ? 'Generating…' : 'Generate sheet'}
            </button>
          </div>
          {costSheetError ? (
            <p className="mt-3 text-sm text-red-300">{costSheetError}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Contribution</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50">Monthly performance view</h2>
          <p className="mt-2 text-sm text-slate-400">
            Contributions are presented by month inside each quarter. Scores remain unchanged—this view simply highlights monthly cadence (Jan, Feb, Mar, etc.).
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-10 text-center text-red-100">
            <h2 className="text-xl font-semibold">Unable to load payroll data</h2>
            <p className="mt-2 text-sm text-red-100/80">{error}</p>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-3xl bg-slate-800/40" />
            ))}
          </div>
        ) : filteredEmployeesByDepartment.length === 0 ? (
          <p className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">
            No employees found for the selected filters.
          </p>
        ) : (
          <div className="space-y-6">
            {filteredEmployeesByDepartment.map((department) => (
              <div
                key={department.id}
                className="rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-inner shadow-black/30"
              >
                <div className="border-b border-slate-800/70 bg-slate-950/40 px-6 py-4">
                  <h3 className="text-xl font-semibold text-slate-50">{department.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {department.employees.length} employee{department.employees.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="divide-y divide-slate-800/70">
                  {department.employees.map((employee) => {
                    const contributionSet =
                      monthFilter === 'all'
                        ? employee.monthlyContributions
                        : employee.monthlyContributions.filter(
                            (contribution) => contribution.monthLabel === monthFilter
                          )

                    return (
                      <div key={employee._id || employee.id} className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-50">{employee.name}</h4>
                            <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-400">
                              <span>ID: {employee.empId}</span>
                              {employee.designation && <span>• {employee.designation}</span>}
                              {employee.email && <span>• {employee.email}</span>}
                              <span>• Salary: {formatCurrency(employee.salary ?? 0)}</span>
                            </div>
                          </div>
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                            {contributionSet.length} contribution{contributionSet.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {contributionSet.length === 0 ? (
                          <p className="text-sm text-slate-500">No contributions for the selected month.</p>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {contributionSet.map((contribution) => (
                              <div
                                key={contribution.monthKey}
                                className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
                                      {contribution.monthLabel}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                                      {formatCycle(contribution.cycle)}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <ContributionMetric label="Academy" value={contribution.academy} />
                                  <ContributionMetric label="Intensive" value={contribution.intensive} />
                                  <ContributionMetric label="NIAT" value={contribution.niat} />
                                  <div className="mt-3 border-t border-slate-800/70 pt-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500">Total</span>
                                      <span className="font-bold text-emerald-300">
                                        {contribution.academy + contribution.intensive + contribution.niat}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {contribution.remarks ? (
                                  <p className="mt-3 text-xs text-slate-500">{contribution.remarks}</p>
                                ) : null}
                                <p className="mt-2 text-xs text-slate-600">
                                  {contribution.submittedAt
                                    ? new Date(contribution.submittedAt).toLocaleDateString()
                                    : '—'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function CostStat({ title, value, helper }) {
  return (
    <article className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 shadow-inner shadow-black/20">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-50">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </article>
  )
}

function ContributionMetric({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}%</span>
    </div>
  )
}
