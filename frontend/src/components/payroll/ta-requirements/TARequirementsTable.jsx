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

export default function TARequirementsTable({ columns, rows, loading }) {
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  Building TA requirements…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  No TA requirements yet. Add new joinee entries to populate this
                  view.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row._id || row.roleNameNormalized}
                  className="border-t border-slate-900/60 hover:bg-slate-900/40"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top text-sm text-slate-200">
                      {renderValue(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


