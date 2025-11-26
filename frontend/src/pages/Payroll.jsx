import { useState } from 'react'

import ExistingEmployeesSheet from './payroll/ExistingEmployeesSheet.jsx'
import NewJoineeSheet from './payroll/NewJoineeSheet.jsx'

const TABS = [
  { id: 'existing', label: 'Existing Employees' },
  { id: 'new', label: 'New Joinees' },
]

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('existing')

  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.5em] text-emerald-200/70">
          Payroll
        </p>
        <h1 className="text-3xl font-semibold text-slate-50">
          Payroll Operations
        </h1>
        <p className="max-w-3xl text-sm text-slate-400">
          Switch between the legacy employee payroll view (placeholder) and the
          brand-new New Joinee payroll sheet. All legacy payroll components are
          retired to keep this space focused and conflict-free.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-900/70 bg-slate-950/70 p-2 text-xs uppercase tracking-[0.4em] text-slate-500">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 rounded-2xl px-6 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-inset ring-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-100',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
                        </div>

      {activeTab === 'existing' ? <ExistingEmployeesSheet /> : <NewJoineeSheet />}
    </section>
  )
}
