import NonPayrollSheet from './nonPayroll/NonPayrollSheet.jsx'

export default function NonPayrollPage() {
  return (
    <section className="space-y-10">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.5em] text-emerald-200/70">Operations</p>
        <h1 className="text-3xl font-semibold text-slate-50">Non-Payroll Operations</h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Manage vendor spends, approvals, and reconciliations inside the dedicated Non-Payroll sheet with the exact
          styling and controls you expect from the payroll workspace.
        </p>
      </header>

      <article className="space-y-6 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-inner shadow-black/30">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-200/70">Non-Payroll Sheet</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50">Non-Payroll Spend Sheet</h2>
          <p className="text-sm text-slate-400">
            Add or edit vendor spends, calculate GST automatically, and keep uploads/export perfectly aligned with the
            new Non-Payroll format.
          </p>
        </div>
        <NonPayrollSheet />
      </article>
    </section>
  )
}


