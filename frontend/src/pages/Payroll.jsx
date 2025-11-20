import { useCallback, useEffect, useMemo, useState } from 'react'

import SearchableSelect from '../components/SearchableSelect.jsx'
import YearSelector from '../components/YearSelector.jsx'
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

const YEAR_OPTIONS = [2025, 2024, 2023]

const ALL_MONTHS = [
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

function formatCurrency(value) {
  if (typeof value !== 'number') return currencyFormatter.format(0)
  return currencyFormatter.format(value)
}

export default function PayrollPage() {
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState(YEAR_OPTIONS[0])
  const [limitedView, setLimitedView] = useState(false)
  const [costSheetLoading, setCostSheetLoading] = useState(false)
  const [costSheetError, setCostSheetError] = useState(null)
  const [monthlySalaryData, setMonthlySalaryData] = useState([])
  const [monthlySalaryError, setMonthlySalaryError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState([])
  const [employeeHistoryLoading, setEmployeeHistoryLoading] = useState(false)
  const [employeeHistoryError, setEmployeeHistoryError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadEmployeesWithContributions() {
      setLoading(true)
      setError(null)
      setLimitedView(false)

      try {
        const response = await apiClient.getEmployeesWithContributions(token, { year: yearFilter })
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
  }, [token, user?.role, user?.department?.id, yearFilter])

  useEffect(() => {
    if (user?.role === 'HOD' && user?.department?.id) {
      setDepartmentFilter(user.department.id)
    }
  }, [user?.role, user?.department?.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false

    async function loadMonthlySalaries() {
      if (monthFilter === 'all') {
        setMonthlySalaryData([])
        setMonthlySalaryError(null)
        return
      }

      setMonthlySalaryError(null)

      try {
        const params = {
          month: monthFilter,
          year: yearFilter,
        }

        if (departmentFilter !== 'all') {
          params.departmentId = departmentFilter
        }

        const response = await apiClient.getMonthlySalaries(token, params)
        if (!cancelled) {
          setMonthlySalaryData(response.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            setMonthlySalaryError(null)
          } else {
            setMonthlySalaryError(err?.message ?? 'Unable to load monthly salaries.')
          }
          setMonthlySalaryData([])
        }
      } finally {
        // intentional no-op
      }
    }

    loadMonthlySalaries()

    return () => {
      cancelled = true
    }
  }, [token, monthFilter, yearFilter, departmentFilter])

  const employeesWithMonthlyContributions = useMemo(() => {
    return employees.map((employee) => {
      const contributionsForYear =
        employee.contributions?.filter((contribution) => {
          const contributionYear =
            typeof contribution.year === 'number' ? contribution.year : YEAR_OPTIONS[0]
          return contributionYear === yearFilter
        }) ?? []

      const monthlyContributions = contributionsForYear.flatMap((contribution) => {
        const months = getMonthsForCycle(contribution.cycle)
        return months.map((monthLabel) => ({
          ...contribution,
          monthLabel,
          monthKey: `${contribution._id || contribution.id || contribution.cycle}-${monthLabel}`,
        }))
      })

      return { ...employee, monthlyContributions }
    })
  }, [employees, yearFilter])

  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm) {
      return []
    }
    const term = debouncedSearchTerm.toLowerCase()
    return employeesWithMonthlyContributions
      .filter((employee) => {
        const nameMatch = employee.name?.toLowerCase().includes(term)
        const idMatch = employee.empId?.toLowerCase().includes(term)
        return nameMatch || idMatch
      })
      .slice(0, 8)
  }, [debouncedSearchTerm, employeesWithMonthlyContributions])

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

  const monthOptions = useMemo(
    () => availableMonths.map((month) => ({ id: month, name: month })),
    [availableMonths]
  )

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

  const monthlySalaryMap = useMemo(() => {
    const map = new Map()
    monthlySalaryData.forEach((entry) => {
      const employeeId =
        entry.employee?.id || entry.employee?._id || entry.employee?.employee || entry.employee
      if (employeeId) {
        map.set(String(employeeId), entry.amount ?? 0)
      }
    })
    return map
  }, [monthlySalaryData])

  const isMonthSpecific = monthFilter !== 'all'

  const employeesForMetrics = useMemo(() => {
    if (!isMonthSpecific) {
      return employeesInScope
    }

    const activeEmployees = employeesInScope.filter((employee) =>
      employee.monthlyContributions?.some(
        (contribution) => contribution.monthLabel === monthFilter
      )
    )

    return activeEmployees.length > 0 ? activeEmployees : employeesInScope
  }, [employeesInScope, isMonthSpecific, monthFilter])

  const computeEmployeeSalary = useCallback((employee) => {
    if (!isMonthSpecific) {
      return employee.salary ?? 0
    }

    const employeeId = employee._id || employee.id
    if (!employeeId) {
      return Math.round(((employee.salary ?? 0) / 12) || 0)
    }

    if (monthlySalaryMap.has(String(employeeId))) {
      return monthlySalaryMap.get(String(employeeId)) ?? 0
    }

    return Math.round(((employee.salary ?? 0) / 12) || 0)
  }, [isMonthSpecific, monthlySalaryMap])

  const getRoleForYear = useCallback(
    (employee) => {
      const history = employee.designationHistory || {}
      return (
        history?.[yearFilter] ??
        history?.[String(yearFilter)] ??
        employee.designation ??
        '—'
      )
    },
    [yearFilter]
  )

  const buildEmployeeHistoryRows = useCallback((employeeData) => {
    if (!employeeData) {
      setSelectedEmployeeHistory([])
      return
    }

    const contributionMap = new Map()
    employeeData.monthlyContributions?.forEach((entry) => {
      if (entry?.monthLabel) {
        contributionMap.set(entry.monthLabel, entry)
      }
    })

    const monthlySalaryValue = Math.round(((employeeData.salary ?? 0) / 12) || 0)

    const rows = ALL_MONTHS.map((month, index) => {
      const contribution = contributionMap.get(month)
      const academy = typeof contribution?.academy === 'number' ? contribution.academy : null
      const intensive = typeof contribution?.intensive === 'number' ? contribution.intensive : null
      const niat = typeof contribution?.niat === 'number' ? contribution.niat : null
      const total =
        academy === null && intensive === null && niat === null
          ? null
          : (academy || 0) + (intensive || 0) + (niat || 0)

      return {
        month,
        academy,
        intensive,
        niat,
        total,
        salary: monthlySalaryValue,
        cycle: `Q${Math.floor(index / 3) + 1}`,
      }
    })

    setSelectedEmployeeHistory(rows)
  }, [])

  const ensureEmployeeData = useCallback(
    async (employeeId) => {
      let found = employeesWithMonthlyContributions.find(
        (employee) => String(employee._id || employee.id) === String(employeeId)
      )

      if (found) {
        return found
      }

      const response = await apiClient.getEmployeesWithContributions(token, { year: yearFilter })
      const refreshedEmployees = response.data ?? []
      setEmployees(refreshedEmployees)
      found = refreshedEmployees.find(
        (employee) => String(employee._id || employee.id) === String(employeeId)
      )
      return found || null
    },
    [employeesWithMonthlyContributions, token, yearFilter]
  )

  const handleEmployeeSelect = useCallback(
    async (employee) => {
      const employeeId = employee._id || employee.id
      if (!employeeId) return

      setShowSearchDropdown(false)
      setSearchTerm(employee.name || employee.empId || '')
      setEmployeeHistoryLoading(true)
      setEmployeeHistoryError(null)

      try {
        const enrichedEmployee = await ensureEmployeeData(employeeId)
        if (!enrichedEmployee) {
          setEmployeeHistoryError('Unable to load employee history.')
          setEmployeeHistoryLoading(false)
          return
        }
        setSelectedEmployee(enrichedEmployee)
        buildEmployeeHistoryRows(enrichedEmployee)
      } catch (err) {
        setEmployeeHistoryError(err?.message ?? 'Unable to load employee history.')
      } finally {
        setEmployeeHistoryLoading(false)
      }
    },
    [ensureEmployeeData, buildEmployeeHistoryRows]
  )

  const handleClearSelectedEmployee = () => {
    setSelectedEmployee(null)
    setSelectedEmployeeHistory([])
    setSearchTerm('')
    setEmployeeHistoryError(null)
  }

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => {
      setShowSearchDropdown(false)
    }, 150)
  }, [])

  const totalCost = useMemo(
    () => employeesForMetrics.reduce((sum, employee) => sum + computeEmployeeSalary(employee), 0),
    [employeesForMetrics, computeEmployeeSalary]
  )

  const averageSalary = useMemo(() => {
    if (employeesForMetrics.length === 0) {
      return 0
    }
    return totalCost / employeesForMetrics.length
  }, [employeesForMetrics.length, totalCost])

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
        <div className="max-w-xl">
          <label className="text-xs font-medium uppercase tracking-[0.4em] text-slate-500">Employee search</label>
          <div className="relative mt-2">
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setShowSearchDropdown(true)
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={handleSearchBlur}
              placeholder="Search by name or employee ID"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            {showSearchDropdown && debouncedSearchTerm ? (
              <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-800/70 bg-slate-950/95 shadow-2xl">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">No matching employees found.</p>
                ) : (
                  searchResults.map((employee) => (
                    <button
                      key={employee._id || employee.id}
                      type="button"
                      onMouseDown={() => handleEmployeeSelect(employee)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-900/80"
                    >
                      <span className="font-semibold text-slate-50">{employee.name}</span>
                      <span className="text-xs text-slate-400">{employee.empId || '—'}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>

        {selectedEmployee ? (
          <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-50">{selectedEmployee.name}</h3>
                <p className="text-sm text-slate-400">
                  {selectedEmployee.empId ? `ID: ${selectedEmployee.empId}` : '—'}
                  {selectedEmployee.email ? ` · ${selectedEmployee.email}` : ''}
                </p>
                <p className="text-sm text-slate-400">
                  {selectedEmployee.department?.name || '—'}
                  {' · '}
                  {getRoleForYear(selectedEmployee)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearSelectedEmployee}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Clear search
              </button>
            </div>

            {employeeHistoryLoading ? (
              <p className="text-sm text-slate-400">Loading history…</p>
            ) : employeeHistoryError ? (
              <p className="text-sm text-red-300">{employeeHistoryError}</p>
            ) : selectedEmployeeHistory.length === 0 ? (
              <p className="text-sm text-slate-400">No contribution history available for the selected employee.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-200">
                  <thead className="bg-slate-900/40 text-xs uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Month</th>
                      <th className="px-4 py-3 font-semibold">Academy %</th>
                      <th className="px-4 py-3 font-semibold">Intensive %</th>
                      <th className="px-4 py-3 font-semibold">NIAT %</th>
                      <th className="px-4 py-3 font-semibold">Total %</th>
                      <th className="px-4 py-3 font-semibold">Salary</th>
                      <th className="px-4 py-3 font-semibold">Cycle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {selectedEmployeeHistory.map((row) => (
                      <tr key={`${selectedEmployee._id || selectedEmployee.id}-${row.month}`} className="bg-slate-950/30">
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-50">{row.month}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-slate-100">
                          {row.academy !== null ? `${row.academy}%` : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-slate-100">
                          {row.intensive !== null ? `${row.intensive}%` : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-slate-100">
                          {row.niat !== null ? `${row.niat}%` : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center text-emerald-300">
                          {row.total !== null ? `${row.total}%` : '—'}
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 text-slate-100 ${isAdmin ? 'blur-sm select-none' : ''}`}>
                          {row.salary ? formatCurrency(row.salary) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400">{row.cycle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Cost centre</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-50">Salary impact</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchableSelect
              id="month-filter"
              label="Month"
              value={monthFilter}
              onChange={(selection) => setMonthFilter(selection)}
              options={monthOptions}
              placeholder="Select month"
              searchPlaceholder="Search months..."
              emptyLabel="No months found"
              includeAllOption
              allOptionLabel="All months"
              allOptionValue="all"
              className="w-full sm:w-48"
            />
            <YearSelector value={yearFilter} options={YEAR_OPTIONS} onChange={setYearFilter} />

            {user?.role === 'Admin' && (
              <SearchableSelect
                id="department-filter"
                label="Department"
                value={departmentFilter}
                onChange={(selection) => setDepartmentFilter(selection)}
                options={departments}
                placeholder="Select department"
                searchPlaceholder="Search departments..."
                emptyLabel="No departments found"
                includeAllOption
                allOptionLabel="All departments"
                allOptionValue="all"
                className="w-full sm:w-56"
              />
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CostStat
            title="Total salary cost"
            value={formatCurrency(totalCost)}
            helper={isMonthSpecific ? `For ${monthFilter}` : 'Visible employees'}
          />
          <CostStat
            title="Average salary"
            value={formatCurrency(Math.round(averageSalary))}
            helper={isMonthSpecific ? `Per employee in ${monthFilter}` : 'Per employee'}
          />
          <CostStat
            title="Headcount"
            value={employeesInScope.length}
            helper={departmentFilter === 'all' ? 'Across all departments' : 'Filtered department'}
          />
        </div>

        {isMonthSpecific && monthlySalaryError ? (
          <p className="text-sm text-red-300">{monthlySalaryError}</p>
        ) : null}

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

                <div className="px-6 py-6 space-y-6">
                  {(() => {
                    const monthCandidates =
                      monthFilter === 'all' ? availableMonths : [monthFilter]

                    const departmentMonths = monthCandidates.filter((month) =>
                      department.employees.some((employee) =>
                        employee.monthlyContributions?.some(
                          (contribution) => contribution.monthLabel === month
                        )
                      )
                    )

                    if (departmentMonths.length === 0) {
                      return (
                        <p className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-6 text-sm text-slate-400">
                          No contributions recorded for the selected filters.
                        </p>
                      )
                    }

                    return departmentMonths.map((month) => (
                      <div
                        key={`${department.id}-${month}`}
                        className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Month</p>
                            <h4 className="text-lg font-semibold text-slate-50">{month}</h4>
                          </div>
                          <p className="text-xs text-slate-500">
                            Showing {department.employees.length} employee{department.employees.length !== 1 ? 's' : ''} ·{' '}
                            {department.name}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-800/60 text-left text-sm text-slate-200">
                            <thead className="bg-slate-900/40 text-xs uppercase tracking-widest text-slate-500">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Employee ID</th>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="px-4 py-3 font-semibold">Role / Designation</th>
                                <th className="px-4 py-3 font-semibold">Email</th>
                                <th className="px-4 py-3 font-semibold">Salary</th>
                                <th className="px-4 py-3 font-semibold">Academy %</th>
                                <th className="px-4 py-3 font-semibold">Intensive %</th>
                                <th className="px-4 py-3 font-semibold">NIAT %</th>
                                <th className="px-4 py-3 font-semibold">Total %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {department.employees.map((employee) => {
                                const contribution = employee.monthlyContributions?.find(
                                  (entry) => entry.monthLabel === month
                                )

                                const academy = typeof contribution?.academy === 'number' ? contribution.academy : null
                                const intensive =
                                  typeof contribution?.intensive === 'number' ? contribution.intensive : null
                                const niat = typeof contribution?.niat === 'number' ? contribution.niat : null
                                const total =
                                  academy === null && intensive === null && niat === null
                                    ? null
                                    : (academy || 0) + (intensive || 0) + (niat || 0)

                                const roleDisplay = getRoleForYear(employee)

                                const displaySalary =
                                  monthFilter === 'all'
                                    ? Math.round(((employee.salary ?? 0) / 12) || 0)
                                    : computeEmployeeSalary(employee)

                                return (
                                  <tr key={`${employee._id || employee.id}-${month}`} className="bg-slate-950/30">
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">{employee.empId || '—'}</td>
                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-50">
                                      {employee.name}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                                      {roleDisplay}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                                      {employee.email || '—'}
                                    </td>
                                    <td className={`whitespace-nowrap px-4 py-3 text-slate-100 ${isAdmin ? 'blur-sm select-none' : ''}`}>
                                      {formatCurrency(displaySalary)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-center text-slate-100">
                                      {academy !== null ? `${academy}%` : '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-center text-slate-100">
                                      {intensive !== null ? `${intensive}%` : '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-center text-slate-100">
                                      {niat !== null ? `${niat}%` : '—'}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-center font-semibold text-emerald-300">
                                      {total !== null ? `${total}%` : '—'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  })()}
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
