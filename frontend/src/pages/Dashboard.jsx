import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

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

export default function DashboardPage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [contributions, setContributions] = useState([])
  const [generatingReport, setGeneratingReport] = useState(false)
  const [generatingSheet, setGeneratingSheet] = useState(false)
  const [sendingSheet, setSendingSheet] = useState(false)
  const [generatingDeptSheet, setGeneratingDeptSheet] = useState(null) // Track which department sheet is being generated
  
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

  const contributionStats = aggregateContributions(filteredContributions)
  const currentDepartment =
    user?.department && departments.length === 0
      ? user.department
      : departments.find((dept) => dept.id === user?.department?.id) ?? user?.department ?? null

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
            {user?.role === 'HOD' && user?.department && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setGeneratingSheet(true)
                    try {
                      await apiClient.exportDepartmentEmployeeContributions(token)
                      setError(null)
                    } catch (err) {
                      setError(err?.message ?? 'Failed to generate sheet. Please try again.')
                    } finally {
                      setGeneratingSheet(false)
                    }
                  }}
                  disabled={generatingSheet}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/60 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generatingSheet ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>📄</span>
                      Generate Sheet
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setSendingSheet(true)
                    try {
                      const result = await apiClient.sendSheetToAdmin(token)
                      setError(null)
                      // Show success message
                      setAlerts([{
                        type: 'info',
                        title: 'Sheet Sent',
                        message: result?.message ?? 'Sheet has been sent to administrators successfully.',
                      }])
                    } catch (err) {
                      setError(err?.message ?? 'Failed to send sheet. Please try again.')
                    } finally {
                      setSendingSheet(false)
                    }
                  }}
                  disabled={sendingSheet || generatingSheet}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/60 bg-blue-500/20 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:border-blue-300 hover:bg-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sendingSheet ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      Send Sheet
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
            <InsightCard
              title="Departments"
              value={loading ? '—' : departments.length || '—'}
              helper="Available for your role"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Latest contributions</h2>
                    <p className="text-xs text-slate-500">Most recent submissions appear first.</p>
                  </div>
                  <Link
                    to="/contributions"
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
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
                <h2 className="text-lg font-semibold text-slate-100">People snapshot</h2>
                <p className="mt-1 text-xs text-slate-500">Top departments by headcount.</p>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <SkeletonRows count={4} />
                  ) : filteredEmployees.length === 0 ? (
                    <p className="rounded-2xl border border-slate-800/60 bg-slate-900/80 px-4 py-6 text-sm text-slate-400">
                      No employee data visible. Ask an administrator to grant you access.
                    </p>
                  ) : (
                    Object.entries(
                      filteredEmployees.reduce((acc, employee) => {
                        const deptName = employee.department?.name ?? 'Unassigned'
                        acc[deptName] = (acc[deptName] ?? 0) + 1
                        return acc
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([deptName, count]) => (
                        <div
                          key={deptName}
                          className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/70 px-3 py-3 text-sm text-slate-200"
                        >
                          <div>
                            <p className="font-medium text-slate-100">{deptName}</p>
                            <p className="text-xs text-slate-400">Team members</p>
                          </div>
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                            {count}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-6 shadow-inner shadow-black/30">
                <h2 className="text-lg font-semibold text-slate-100">Next best actions</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <ActionItem
                    title="Review employee updates"
                    description="Ensure personnel records are current across all departments."
                    href="/employees"
                  />
                  <ActionItem
                    title="Submit contribution cycle"
                    description="New cycle submissions keep leadership informed and aligned."
                    href="/contributions"
                  />
                  <ActionItem
                    title="Audit department structure"
                    description="Confirm the correct HOD assignments and codes for every department."
                    href="/departments"
                  />
                </ul>
              </div>
            </div>
          </section>
        </>
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

function ActionItem({ title, description, href }) {
  return (
    <li className="rounded-2xl border border-slate-800/60 bg-slate-900/70 px-4 py-3">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      <Link to={href} className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-300 hover:text-emerald-200">
        Go now →
      </Link>
    </li>
  )
}


