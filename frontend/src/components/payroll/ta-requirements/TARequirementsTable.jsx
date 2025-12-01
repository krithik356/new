const DEFAULT_COLUMN_WIDTH = 160
const MAX_INPUT_WIDTH = 640
const CHAR_PIXEL_WIDTH = 9
const EXTRA_PADDING = 32

const NUMERIC_FIELDS = new Set([
  'noOfPositions',
  'januaryPositions',
  'februaryPositions',
  'marchPositions',
])

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

const buildInputStyle = (column, value, isNumericField) => {
  const baseWidth = getNumericWidth(column.width)
  if (isNumericField) {
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

const renderValue = (value) => {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? '—' : value
  }
  const normalized = value.toString().trim()
  return normalized.length > 0 ? normalized : '—'
}

export default function TARequirementsTable({
  columns,
  rows,
  loading,
  role,
  isEditMode = false,
  savingId,
  onFieldChange,
  onSaveRow,
  onDeleteRow,
  rowErrors = {},
}) {
  const canEdit = role === 'Admin' || role === 'HOD'
  const canDelete = role === 'Admin' || role === 'HOD'
  const showEditControls = isEditMode && canEdit

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
              {showEditControls && (
                <th className="w-40 px-4 py-3 text-right text-[0.65rem] uppercase tracking-[0.5em] text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (showEditControls ? 1 : 0)}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  Building TA requirements…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showEditControls ? 1 : 0)}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  No TA requirements yet. Add new joinee entries to populate this
                  view.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowError = rowErrors[row._id]
                const isNumericField = (key) => NUMERIC_FIELDS.has(key)
                return (
                  <tr
                    key={row._id || row.roleNameNormalized}
                    className="border-t border-slate-900/60 hover:bg-slate-900/40"
                  >
                    {columns.map((column) => {
                      const value = row[column.key] ?? ''
                      const isNumeric = isNumericField(column.key)
                      return (
                        <td key={column.key} className="px-4 py-3 align-top text-sm text-slate-200">
                          {showEditControls ? (
                            <input
                              type={isNumeric ? 'number' : 'text'}
                              value={value}
                              onChange={(event) =>
                                onFieldChange(
                                  row._id,
                                  column.key,
                                  isNumeric
                                    ? parseInt(event.target.value, 10) || 0
                                    : event.target.value
                                )
                              }
                              style={buildInputStyle(column, value, isNumeric)}
                              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                            />
                          ) : (
                            renderValue(row[column.key])
                          )}
                        </td>
                      )
                    })}
                    {showEditControls && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col gap-2 text-xs text-slate-400">
                          <button
                            type="button"
                            onClick={() => onSaveRow(row)}
                            disabled={savingId === row._id || Boolean(rowError)}
                            className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {row._id.startsWith('temp-') ? 'Save' : 'Update'}
                          </button>
                          {canDelete && row._id && !row._id.startsWith('temp-') ? (
                            <button
                              type="button"
                              onClick={() => onDeleteRow(row)}
                              className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          ) : null}
                          {rowError ? (
                            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-red-400">
                              {rowError}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    )}
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
