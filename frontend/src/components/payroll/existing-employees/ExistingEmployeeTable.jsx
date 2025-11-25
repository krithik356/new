const DATE_FIELDS = new Set(['doj', 'doe'])
const DEFAULT_COLUMN_WIDTH = 160
const MAX_INPUT_WIDTH = 640
const CHAR_PIXEL_WIDTH = 9
const EXTRA_PADDING = 32

const getNumericWidth = (width) => {
  if (typeof width === 'number') {
    return width
  }
  if (typeof width === 'string') {
    const parsed = parseInt(width, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return DEFAULT_COLUMN_WIDTH
}

const buildInputStyle = (column, value, isDateField) => {
  const baseWidth = getNumericWidth(column.width)
  if (isDateField) {
    return { minWidth: `${baseWidth}px` }
  }
  const dynamicWidth = Math.max(
    baseWidth,
    Math.min(
      (value?.length || 0) * CHAR_PIXEL_WIDTH + EXTRA_PADDING,
      MAX_INPUT_WIDTH
    )
  )
  return {
    minWidth: `${baseWidth}px`,
    width: `${dynamicWidth}px`,
  }
}

export default function ExistingEmployeeTable({
  columns,
  rows,
  loading,
  savingId,
  role,
  onFieldChange,
  onSaveRow,
  onDeleteRow,
}) {
  const isAdmin = role === 'Admin'

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/80 shadow-2xl shadow-black/30">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] table-auto border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ minWidth: column.width }}
                  className="px-4 py-3 text-left text-[0.65rem] uppercase tracking-[0.5em] text-slate-500"
                >
                  {column.label}
                </th>
              ))}
              <th className="w-40 px-4 py-3 text-right text-[0.65rem] uppercase tracking-[0.5em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  Loading existing employees sheet…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  No entries yet. Use “Add Row” to begin planning.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row._id}
                  className="border-t border-slate-900/60 hover:bg-slate-900/40"
                >
                  {columns.map((column) => {
                    const isDateField = DATE_FIELDS.has(column.key)
                    const value = row[column.key] ?? ''
                    return (
                      <td key={column.key} className="px-4 py-3 align-top">
                        <input
                          type={isDateField ? 'date' : 'text'}
                          value={value}
                          onChange={(event) =>
                            onFieldChange(
                              row._id,
                              column.key,
                              event.target.value
                            )
                          }
                          style={buildInputStyle(column, value, isDateField)}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                        />
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col gap-2 text-xs text-slate-400">
                      <button
                        type="button"
                        onClick={() => onSaveRow(row)}
                        disabled={savingId === row._id}
                        className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {row._id.startsWith('temp-') ? 'Save' : 'Update'}
                      </button>
                      {isAdmin && row._id && !row._id.startsWith('temp-') ? (
                        <button
                          type="button"
                          onClick={() => onDeleteRow(row)}
                          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


