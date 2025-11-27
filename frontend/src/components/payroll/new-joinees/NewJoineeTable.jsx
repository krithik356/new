const DATE_FIELDS = new Set(['doj', 'doe'])
const DEFAULT_COLUMN_WIDTH = 160
const MAX_INPUT_WIDTH = 640
const CHAR_PIXEL_WIDTH = 9
const EXTRA_PADDING = 32

const WORK_LOCATION_OPTIONS = [
  'Brigade Towers: Ground Floor - East Wing',
  'Brigade Towers: First Floor - East Wing',
  'Brigade Towers: Second Floor - East Wing',
  'Brigade Towers: Fourth Floor - East Wing',
  'Brigade Towers: Fourth Floor - West Wing',
  'Kapil Kavuri Hub - First Floor',
  'Kapil Kavuri Hub - Fifth Floor',
  'Kapil Kavuri Hub - Ninth Floor (ALT F)',
  'iSprout',
  'Sohini Techpark',
  'Pune - Experience Center',
  'Bangalore - NxtWave Office',
  'Chennai - NxtWave Office',
  'The Hive',
  'AMET',
  'Annamacharya University',
  'CIET & CITY - Chalapathi',
  'Delhi - NxtWave Office',
  'Jaipur - NxtWave Office',
  'Yenepoya',
  'Vijayawada - Experience Center',
  'Tirupati - Experience Center',
  'Kadapa - Experience Center',
  'Anantapur - Experience Center',
  'Noida International University',
  'Vivekananda Global University',
  'A Dy Patil University',
  'Sanjay Ghodawat University',
  'S-Vyasa University',
  'Crescent University',
  'Takshasila University',
  'NRI',
  'NSRIT',
  'Chaitanya Deemed University',
  'BITS',
  'Malla Reddy Vishwavidyapeeth',
  'Aurora University',
  'BITTS Bilani University',
  'KFinTech',
  'Office - We Work',
]

const EMPLOYMENT_TYPE_OPTIONS = [
  'Employee',
  'Freelancer',
  'Internship',
  'Intern + Employee',
  'Consultant',
  'Consultant + Employee',
]

const PRODUCT_DOMAIN_OPTIONS = [
  'Academy',
  'Intensive',
  'NIAT',
  'NAIT',
  'Operations',
  'Technology',
  'Other',
]

const ASSET_REQUIREMENT_OPTIONS = [
  'Windows Laptop',
  'MacBook',
  'Monitor 24"',
  'iPad',
  'Android Tablet',
  'Mobile Phone',
  'Desktop',
  'Accessories',
  'NA',
  'Other',
]

const PROCESSOR_OPTIONS = [
  'Intel i5',
  'Intel i7',
  'Intel i9',
  'AMD Ryzen 5',
  'AMD Ryzen 7',
  'Apple M2',
  'Apple M3',
  'Apple M4',
  'NA',
]

const OPERATING_SYSTEM_OPTIONS = [
  'Windows 10',
  'Windows 11',
  'Ubuntu',
  'macOS',
  'ChromeOS',
  'NA',
]

const STORAGE_OPTIONS = ['256 GB', '512 GB', '1 TB', '2 TB', 'NA']
const RAM_OPTIONS = ['8 GB', '12 GB', '16 GB', '32 GB', '64 GB', 'NA']
const DISPLAY_SIZE_OPTIONS = ['13 inch', '14 inch', '15 inch', '16 inch', '24" Monitor', '27" Monitor', 'NA']
const GPU_OPTIONS = ['Integrated', 'NVIDIA GTX 1650', 'NVIDIA RTX 3060', 'NVIDIA RTX 4060', 'Apple GPU', 'NA']
const PERIPHERAL_OPTIONS = ['Mouse', 'Keyboard', 'Headset', 'Docking Station', 'HDMI Adapter', 'NA', 'Other']
const HEADPHONE_OPTIONS = ['NA', 'Jabra', 'Sony', 'Bose', 'Apple AirPods', 'Logitech', 'Other']
const MOBILE_PHONE_OPTIONS = ['NA', 'iPhone', 'Android', 'Samsung', 'OnePlus', 'Pixel', 'Other']

const FIELD_OPTIONS = {
  workMode: ['WFO', 'WFH', 'Hybrid'],
  type: ['New Hire', 'Replacement', 'Backfill'],
  workLocation: WORK_LOCATION_OPTIONS,
  employmentType: EMPLOYMENT_TYPE_OPTIONS,
  productOrDomain: PRODUCT_DOMAIN_OPTIONS,
  assetRequirement: ASSET_REQUIREMENT_OPTIONS,
  processor: PROCESSOR_OPTIONS,
  operatingSystem: OPERATING_SYSTEM_OPTIONS,
  storage: STORAGE_OPTIONS,
  ram: RAM_OPTIONS,
  displaySize: DISPLAY_SIZE_OPTIONS,
  graphicCard: GPU_OPTIONS,
  peripherals: PERIPHERAL_OPTIONS,
  headPhone: HEADPHONE_OPTIONS,
  mobilePhone: MOBILE_PHONE_OPTIONS,
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

export default function NewJoineeTable({
  columns,
  rows,
  loading,
  savingId,
  role,
  isEditMode = false,
  onFieldChange,
  onSaveRow,
  onDeleteRow,
  rowErrors = {},
}) {
  const canDelete = role === 'Admin' || role === 'HOD'
  const canEdit = role === 'Admin' || role === 'HOD'
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
                  Loading new joinee sheet…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showEditControls ? 1 : 0)}
                  className="px-4 py-16 text-center text-sm text-slate-400"
                >
                  No entries yet. Use "Add Row" to begin planning.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowError = rowErrors[row._id]
                return (
                  <tr
                    key={row._id}
                    className="border-t border-slate-900/60 hover:bg-slate-900/40"
                  >
                    {columns.map((column) => {
                      const isDateField = DATE_FIELDS.has(column.key)
                      const options = FIELD_OPTIONS[column.key]
                      const value = row[column.key] ?? ''
                      const handleChange = (event) =>
                        onFieldChange(row._id, column.key, event.target.value)

                      return (
                        <td key={column.key} className="px-4 py-3 align-top text-sm text-slate-200">
                          {showEditControls ? (
                            options ? (
                              <select
                                value={value}
                                onChange={handleChange}
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select {column.label}</option>
                                {options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={isDateField ? 'date' : 'text'}
                                value={value}
                                onChange={handleChange}
                                style={buildInputStyle(column, value, isDateField)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              />
                            )
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

