const READ_ONLY_KEYS = new Set(['serviceDurationDays', 'budgetedPaymentAmountInclGst'])

const baseInputClasses =
  'w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40'

const errorInputClasses =
  'border-red-500/70 focus:border-red-500 focus:ring-red-500/40 bg-red-950/30 text-red-100 placeholder-red-300'

const actionButtonClasses =
  'rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50'

export default function NonPayrollTable({
  columns,
  rows,
  loading,
  savingId,
  rowErrors,
  onFieldChange,
  onSaveRow,
  onDeleteRow,
  typeOptions,
  monthOptions,
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/80 shadow-2xl shadow-black/30">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] table-auto border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-[0.65rem] uppercase tracking-[0.5em] text-slate-500"
                  style={{ minWidth: column.width ?? 200 }}
                >
                  {column.label}
                </th>
              ))}
              <th className="w-48 px-4 py-3 text-right text-[0.65rem] uppercase tracking-[0.5em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center text-sm text-slate-400">
                  Loading non-payroll items…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center text-sm text-slate-400">
                  No entries yet. Use “Add Row” to start planning non-payroll spend.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowError = rowErrors[row._id]
                return (
                  <tr
                    key={row._id}
                    className={`border-t border-slate-900/60 ${rowError ? 'bg-red-950/10 hover:bg-red-950/20' : 'hover:bg-slate-900/40'}`}
                  >
                    {columns.map((column) => {
                      // Use formatted duration for display if available
                      const displayValue = column.key === 'serviceDurationDays' && row.serviceDurationFormatted
                        ? row.serviceDurationFormatted
                        : row[column.key] ?? ''
                      const value = row[column.key] ?? ''
                      const fieldError = rowError?.fields?.[column.key]
                      const inputClasses = `${baseInputClasses} ${fieldError ? errorInputClasses : ''}`
                      const isReadOnly = READ_ONLY_KEYS.has(column.key) || column.readOnly

                      let inputElement = null

                      if (column.input === 'textarea') {
                        inputElement = (
                          <textarea
                            value={value}
                            onChange={(event) => onFieldChange(row._id, column.key, event.target.value)}
                            rows={column.rows ?? 2}
                            className={inputClasses}
                          />
                        )
                      } else if (column.input === 'select-type') {
                        inputElement = (
                          <select
                            value={value}
                            onChange={(event) => onFieldChange(row._id, column.key, event.target.value)}
                            className={inputClasses}
                          >
                            <option value="">Select type</option>
                            {typeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )
                      } else if (column.input === 'select-month') {
                        inputElement = (
                          <select
                            value={value}
                            onChange={(event) => onFieldChange(row._id, column.key, event.target.value)}
                            className={inputClasses}
                          >
                            <option value="">Select month</option>
                            {monthOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )
                      } else if (column.input === 'readonly') {
                        inputElement = (
                          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                            {displayValue === '' || displayValue === null ? '—' : displayValue}
                          </div>
                        )
                      } else if (column.input === 'date') {
                        inputElement = (
                          <input
                            type="date"
                            value={value}
                            onChange={(event) => onFieldChange(row._id, column.key, event.target.value)}
                            className={inputClasses}
                          />
                        )
                      } else if (column.input === 'number') {
                        inputElement = (
                          <input
                            type="number"
                            value={value}
                            onChange={(event) => onFieldChange(row._id, column.key, event.target.value)}
                            className={inputClasses}
                          />
                        )
                      } else {
                        inputElement = (
                          <input
                            type="text"
                            value={value}
                            onChange={(event) => onFieldChange(row._id, column.key, event.target.value)}
                            className={inputClasses}
                          />
                        )
                      }

                      return (
                        <td key={column.key} className="px-4 py-3 align-top">
                          {isReadOnly ? (
                            <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                              {displayValue === '' || displayValue === null ? '—' : displayValue}
                            </div>
                          ) : (
                            <div data-row-id={row._id} data-field={column.key}>
                              {inputElement}
                            </div>
                          )}
                          {fieldError ? (
                            <p className="mt-1 text-xs text-red-300">{fieldError}</p>
                          ) : null}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col gap-2 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => onSaveRow(row)}
                          disabled={savingId === row._id || rowError?.messages?.length > 0}
                          className={actionButtonClasses}
                        >
                          {row._id.startsWith('temp-') ? 'Save' : 'Update'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row)}
                          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                        {rowError?.messages?.length ? (
                          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-red-400">
                            {rowError.messages[0]}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


