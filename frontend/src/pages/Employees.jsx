import { useEffect, useMemo, useState } from 'react'

import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

export default function EmployeesPage() {
  const { token, user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  useEffect(() => {
    let cancelled = false

    async function loadEmployees() {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getEmployees(token)
        if (!cancelled) {
          setEmployees(response.data ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading employees:', err)
          const errorMessage = err instanceof ApiError 
            ? err.message 
            : err?.message ?? 'Unable to load employees.'
          setError(errorMessage)
          setEmployees([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEmployees()

    return () => {
      cancelled = true
    }
  }, [token])

  // First, filter employees by HOD's department if applicable
  const departmentFilteredEmployees = useMemo(() => {
    if (user?.role === 'HOD' && user?.department?.id) {
      return employees.filter(emp => 
        emp.department && 
        (emp.department.id === user.department.id || emp.department._id === user.department.id)
      )
    }
    return employees
  }, [employees, user?.role, user?.department?.id])

  const departments = useMemo(() => {
    const unique = new Map()
    departmentFilteredEmployees.forEach((employee) => {
      if (employee.department) {
        unique.set(employee.department.id ?? employee.department._id, employee.department.name)
      }
    })
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [departmentFilteredEmployees])

  const employeesByDepartment = useMemo(() => {
    const grouped = new Map()
    departmentFilteredEmployees.forEach((employee) => {
      const deptId = employee.department?.id ?? employee.department?._id ?? 'unassigned'
      const deptName = employee.department?.name ?? 'Unassigned'
      if (!grouped.has(deptId)) {
        grouped.set(deptId, {
          id: deptId,
          name: deptName,
          code: employee.department?.code,
          employees: [],
        })
      }
      grouped.get(deptId).employees.push(employee)
    })
    
    // Sort employees within each department
    grouped.forEach((dept) => {
      dept.employees.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
    })
    
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.name === 'Unassigned') return 1
      if (b.name === 'Unassigned') return -1
      return a.name.localeCompare(b.name)
    })
  }, [departmentFilteredEmployees])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    
    return employeesByDepartment
      .map((dept) => {
        const filtered = dept.employees.filter((employee) => {
          const matchesSearch =
            !query ||
            [employee.name, employee.email, employee.empId]
              .filter(Boolean)
              .some((value) => value.toLowerCase().includes(query))

          const matchesDepartment =
            departmentFilter === 'all' ||
            (employee.department && (employee.department.id ?? employee.department._id) === departmentFilter)

          return matchesSearch && matchesDepartment
        })
        
        return { ...dept, employees: filtered }
      })
      .filter((dept) => dept.employees.length > 0)
  }, [employeesByDepartment, search, departmentFilter])

  const employeeCount = filteredEmployees.reduce((sum, dept) => sum + dept.employees.length, 0)
  const totalCount = departmentFilteredEmployees.length

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">People</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Employees</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Browse every employee you have access to, search instantly, and filter by department to surface the right
          teammate.
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
        {!loading && !error && user?.role === 'Admin' && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Showing <span className="font-semibold">{employeeCount}</span> of <span className="font-semibold">{totalCount}</span> employees
            {departmentFilter !== 'all' && ` in ${departments.find(d => d.id === departmentFilter)?.name || 'selected department'}`}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-inner shadow-black/30 sm:flex-row sm:items-center">
        <div className="flex w-full flex-col gap-2 sm:w-72">
          <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor="search">
            Search
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by name, email, or employee ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {user?.role === 'Admin' && (
          <div className="flex w-full flex-col gap-2 sm:w-64">
            <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor="department">
              Department
            </label>
            <select
              id="department"
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

      {error && (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-red-200">
          <p className="font-semibold">Error loading employees</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-12 text-center text-slate-400">
          Loading employees...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-12 text-center text-slate-400">
          {error ? 'Unable to load employees.' : 'No employees match your criteria.'}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEmployees.map((dept) => (
            <div
              key={dept.id}
              className="overflow-hidden rounded-3xl border border-slate-800/70 shadow-2xl shadow-black/30"
            >
              <div className="border-b border-slate-800/80 bg-slate-950/80 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">{dept.name}</h2>
                    {dept.code && (
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mt-1">{dept.code}</p>
                    )}
                  </div>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-sm font-semibold text-emerald-200">
                    {dept.employees.length} {dept.employees.length === 1 ? 'employee' : 'employees'}
                  </span>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-auto bg-slate-950/60">
                <table className="min-w-full divide-y divide-slate-800/80 text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-950/80 text-left uppercase tracking-[0.3em] text-slate-500 backdrop-blur-sm">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        Employee
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        Designation
                      </th>
                      <th scope="col" className="px-6 py-4 font-semibold">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {dept.employees.map((employee) => (
                      <tr key={employee.id ?? employee._id ?? employee.empId} className="hover:bg-slate-900/50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-100">{employee.name}</p>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{employee.empId ?? '—'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{employee.designation ?? '—'}</td>
                        <td className="px-6 py-4">{employee.email ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}


