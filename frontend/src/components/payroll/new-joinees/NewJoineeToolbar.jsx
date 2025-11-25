const DEFAULT_DEPARTMENTS = [
  { value: 'all', label: 'All Departments' },
  { value: 'tech', label: 'Tech' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
]

export default function NewJoineeToolbar({
  role,
  activeDepartment,
  onDepartmentChange,
  onAddRow,
  onGenerateSheet,
  loading,
  exporting,
}) {
  const isAdmin = role === 'Admin'

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/80 px-4 py-5 shadow-2xl shadow-black/30 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">
          New Joinees
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-50">
          New Joinee Payroll Sheet
        </h2>
        <p className="text-sm text-slate-400">
          Maintain upcoming joinees, hardware logistics, and approvals in one
          collaborative sheet.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {isAdmin ? (
          <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-slate-500">
            Department
            <select
              value={activeDepartment}
              onChange={(event) => onDepartmentChange(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            >
              {DEFAULT_DEPARTMENTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-200">
            HOD Department Scope
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onAddRow}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add Row
          </button>
          <button
            type="button"
            onClick={onGenerateSheet}
            disabled={loading || exporting}
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? 'Generating…' : 'Generate Sheet'}
          </button>
        </div>
      </div>
    </div>
  )
}

