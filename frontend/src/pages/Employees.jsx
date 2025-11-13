import { useEffect, useMemo, useState } from 'react'

import { apiClient } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

export default function EmployeesPage() {
  const { token } = useAuth()
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
          setError(err?.message ?? 'Unable to load employees.')
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

  const departments = useMemo(() => {
    const unique = new Map()
    employees.forEach((employee) => {
      if (employee.department) {
        unique.set(employee.department.id ?? employee.department._id, employee.department.name)
      }
    })
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return employees.filter((employee) => {
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
  }, [employees, search, departmentFilter])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">People</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Employees</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Browse every employee you have access to, search instantly, and filter by department to surface the right
          teammate.
        </p>
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
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800/70 shadow-2xl shadow-black/30">
        <div className="max-h-[70vh] overflow-auto bg-slate-950/60">
          <table className="min-w-full divide-y divide-slate-800/80 text-sm">
            <thead className="bg-slate-950/80 text-left uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Employee
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  Department
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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Loading employees...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-red-200">
                    {error}
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No employees match your criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id ?? employee._id ?? employee.empId}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-100">{employee.name}</p>
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{employee.empId ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p>{employee.department?.name ?? 'Unassigned'}</p>
                      {employee.department?.code ? (
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                          {employee.department.code}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">{employee.designation ?? '—'}</td>
                    <td className="px-6 py-4">{employee.email ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


