import { useEffect, useMemo, useState } from 'react'

import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

function formatCycle(value) {
  if (!value) return 'Default cycle'
  return value
    .toString()
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ContributionsPage() {
  const { token, user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cycleFilter, setCycleFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [limitedView, setLimitedView] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadEmployeesWithContributions() {
      setLoading(true)
      setError(null)
      setLimitedView(false)

      try {
        const response = await apiClient.getEmployeesWithContributions(token, {
          cycle: cycleFilter !== 'all' ? cycleFilter : undefined,
        })
        if (!cancelled) {
          const employeesData = response.data ?? []
          setEmployees(employeesData)
          
          // If HOD and has department, show limited view message
          if (user?.role === 'HOD' && user?.department?.id) {
            setLimitedView(true)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load contributions.')
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
  }, [token, user?.role, user?.department?.id, cycleFilter])

  // Get all unique cycles from employee contributions
  const cycles = useMemo(() => {
    const allCycles = new Set()
    employees.forEach((emp) => {
      emp.contributions?.forEach((contrib) => {
        if (contrib.cycle) allCycles.add(contrib.cycle)
      })
    })
    return Array.from(allCycles).sort()
  }, [employees])

  // Get all unique departments
  const departments = useMemo(() => {
    const deptMap = new Map()
    employees.forEach((emp) => {
      if (emp.department) {
        const deptId = emp.department._id || emp.department.id
        const deptName = emp.department.name
        if (!deptMap.has(deptId)) {
          deptMap.set(deptId, { id: deptId, name: deptName })
        }
      }
    })
    return Array.from(deptMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [employees])

  // Group employees by department
  const employeesByDepartment = useMemo(() => {
    const grouped = new Map()
    
    employees.forEach((employee) => {
      if (!employee.department) return
      
      const deptId = employee.department._id || employee.department.id
      const deptName = employee.department.name
      
      if (!grouped.has(deptId)) {
        grouped.set(deptId, {
          id: deptId,
          name: deptName,
          employees: [],
        })
      }
      
      grouped.get(deptId).employees.push(employee)
    })
    
    return Array.from(grouped.values())
  }, [employees])

  // Filter by department
  const filteredEmployeesByDepartment = useMemo(() => {
    if (departmentFilter === 'all') {
      return employeesByDepartment
    }
    return employeesByDepartment.filter((dept) => dept.id === departmentFilter)
  }, [employeesByDepartment, departmentFilter])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Performance</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Contributions</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          View employee contributions across cycles, organized by department.
        </p>
        {user?.role === 'HOD' && user?.department && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <p className="font-semibold">Viewing Department:</p>
            <p className="mt-1 text-base font-bold text-emerald-100">
              {user.department.name}
              {user.department.code ? ` (${user.department.code})` : ''}
            </p>
          </div>
        )}
      </header>

      {limitedView && user?.role === 'HOD' ? (
        <div className="rounded-3xl border border-blue-500/40 bg-blue-500/10 px-5 py-4 text-sm text-blue-100">
          <p className="font-semibold">Department View</p>
          <p className="mt-1">You are viewing contributions for your department only: <strong>{user?.department?.name}</strong></p>
        </div>
      ) : null}

      <div className={`grid gap-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30 ${user?.role === 'Admin' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor="cycle">
            Cycle
          </label>
          <select
            id="cycle"
            value={cycleFilter}
            onChange={(event) => setCycleFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="all">All cycles</option>
            {cycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {formatCycle(cycle)}
              </option>
            ))}
          </select>
        </div>

        {user?.role === 'Admin' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor="department-filter">
              Department
            </label>
            <select
              id="department-filter"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-10 text-center text-red-100">
          <h2 className="text-xl font-semibold">Unable to load contributions</h2>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          {user?.role === 'HOD' && !user?.department && (
            <div className="mt-4 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-yellow-100">
              <p className="font-semibold">Action Required</p>
              <p className="mt-1 text-sm">You need to be assigned to a department to view contributions. Please contact an administrator to assign your department.</p>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-64 animate-pulse rounded-3xl bg-slate-800/40" />
          ))}
        </div>
      ) : filteredEmployeesByDepartment.length === 0 ? (
        <p className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">
          No employees with contributions found.
        </p>
      ) : (
        <div className="space-y-6">
          {filteredEmployeesByDepartment.map((department) => (
            <div
              key={department.id}
              className="rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-inner shadow-black/30"
            >
              <div className="border-b border-slate-800/70 bg-slate-950/40 px-6 py-4">
                <h2 className="text-xl font-semibold text-slate-50">{department.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {department.employees.length} employee{department.employees.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="divide-y divide-slate-800/70">
                {department.employees.map((employee) => {
                  const employeeContributions = cycleFilter === 'all' 
                    ? employee.contributions || []
                    : (employee.contributions || []).filter(c => c.cycle === cycleFilter)
                  
                  return (
                    <div key={employee._id || employee.id} className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-50">{employee.name}</h3>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-400">
                            <span>ID: {employee.empId}</span>
                            {employee.designation && <span>• {employee.designation}</span>}
                            {employee.email && <span>• {employee.email}</span>}
                          </div>
                        </div>
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          {employeeContributions.length} contribution{employeeContributions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {employeeContributions.length === 0 ? (
                        <p className="text-sm text-slate-500">No contributions for selected cycle.</p>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {employeeContributions.map((contribution) => (
                            <div
                              key={contribution._id || contribution.id}
                              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
                                  {formatCycle(contribution.cycle || 'default')}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">Academy</span>
                                  <span className="font-semibold text-slate-100">{contribution.academy}%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">Intensive</span>
                                  <span className="font-semibold text-slate-100">{contribution.intensive}%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">NIAT</span>
                                  <span className="font-semibold text-slate-100">{contribution.niat}%</span>
                                </div>
                                <div className="mt-3 border-t border-slate-800/70 pt-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Total</span>
                                    <span className="font-bold text-emerald-300">
                                      {contribution.academy + contribution.intensive + contribution.niat}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {contribution.remarks && (
                                <p className="mt-3 text-xs text-slate-500">{contribution.remarks}</p>
                              )}
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
  )
}
