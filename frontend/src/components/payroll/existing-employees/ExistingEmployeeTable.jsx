import { useState } from 'react'
import { WORK_LOCATION_OPTIONS } from '../../../constants/workLocationOptions.js'

const DATE_FIELDS = new Set(['doj', 'doe'])
const DEFAULT_COLUMN_WIDTH = 160
const MAX_INPUT_WIDTH = 640
const CHAR_PIXEL_WIDTH = 9
const EXTRA_PADDING = 32

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

export default function ExistingEmployeeTable({
  columns,
  rows,
  loading,
  savingId,
  role,
  isEditMode = false,
  onFieldChange,
  onSaveRow,
  onDeleteRow,
  onRequestSignOff,
  onSignOffDecision,
  rowErrors = {},
  monthOptions = [],
  departmentOptions = [],
  topDepartmentOptions = [],
  sourceBeneficiaryDepartmentOptions = [],
  hodOptions = [],
  typeOptions = [],
  employeeTypeOptions = [],
  designationOptions = [],
}) {
  const canDelete = role === 'Admin' || role === 'HOD'
  const canEdit = role === 'Admin' || role === 'HOD'
  const showEditControls = isEditMode && canEdit
  const [rejectRemark, setRejectRemark] = useState({})
  const [showRejectModal, setShowRejectModal] = useState({})

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
                  Loading existing employees sheet…
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
                      const value = row[column.key] ?? ''

                      const isLocationField = column.key === 'location'
                      const isMonthField = column.key === 'month'
                      const isDepartmentField = column.key === 'departmentLabel'
                      const isTopDepartmentField = column.key === 'topDepartment'
                      const isSourceDepartmentField =
                        column.key === 'sourceDepartment'
                      const isBeneficiaryDepartmentField =
                        column.key === 'beneficiaryDepartment'
                      const isSourceHodField = column.key === 'sourceHod'
                      const isBeneficiaryHodField =
                        column.key === 'beneficiaryHod'
                      const isTypeField = column.key === 'type'
                      const isEmployeeTypeField =
                        column.key === 'employeeType'
                      const isDesignationField = column.key === 'designation'
                      const isAmountField = column.key === 'amount'
                      const isPercentageField =
                        column.key === 'academy' ||
                        column.key === 'intensive' ||
                        column.key === 'niatBatch12' ||
                        column.key === 'niatBatch3' ||
                        column.key === 'niatBatch4' ||
                        column.key === 'others' ||
                        column.key === 'common'

                      return (
                        <td key={column.key} className="px-4 py-3 align-top text-sm text-slate-200">
                          {showEditControls ? (
                            isLocationField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select location</option>
                                {WORK_LOCATION_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isMonthField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select month</option>
                                {monthOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isDepartmentField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select department</option>
                                {departmentOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isTopDepartmentField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select top department</option>
                                {topDepartmentOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isSourceDepartmentField ||
                              isBeneficiaryDepartmentField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select department</option>
                                {sourceBeneficiaryDepartmentOptions.map(
                                  (option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : isSourceHodField || isBeneficiaryHodField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select HOD</option>
                                {hodOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isTypeField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select type</option>
                                {typeOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isEmployeeTypeField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select employee type</option>
                                {employeeTypeOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isDesignationField ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              >
                                <option value="">Select designation</option>
                                {designationOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : isAmountField ? (
                              <input
                                type="number"
                                inputMode="decimal"
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value.replace(/[^0-9.]/g, '')
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              />
                            ) : isPercentageField ? (
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={100}
                                step={1}
                                value={value}
                                onChange={(event) =>
                                  onFieldChange(
                                    row._id,
                                    column.key,
                                    event.target.value.replace(/\D/g, '')
                                  )
                                }
                                style={buildInputStyle(column, value, false)}
                                className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                              />
                            ) : (
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
                            )
                          ) : (
                            renderValue(value)
                          )}
                        </td>
                      )
                    })}
                    {showEditControls && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col gap-2 text-xs text-slate-400">
                          {/* Show Accept/Reject buttons for pending sign-offs (HOD view) */}
                          {role === 'HOD' && row.signoffStatus === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onSignOffDecision(row, 'accepted')}
                                className="rounded-xl border border-green-500/40 bg-green-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-green-200 transition hover:bg-green-500/30"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowRejectModal({ ...showRejectModal, [row._id]: true })}
                                className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-500/20"
                              >
                                Reject
                              </button>
                              {showRejectModal[row._id] && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl max-w-md w-full mx-4">
                                    <h3 className="mb-4 text-sm font-semibold text-slate-200">Rejection Remark</h3>
                                    <textarea
                                      value={rejectRemark[row._id] || ''}
                                      onChange={(e) =>
                                        setRejectRemark({ ...rejectRemark, [row._id]: e.target.value })
                                      }
                                      placeholder="Enter reason for rejection..."
                                      className="mb-4 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                                      rows={4}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (rejectRemark[row._id]?.trim()) {
                                            onSignOffDecision(row, 'rejected', rejectRemark[row._id])
                                            setShowRejectModal({ ...showRejectModal, [row._id]: false })
                                            setRejectRemark({ ...rejectRemark, [row._id]: '' })
                                          }
                                        }}
                                        disabled={!rejectRemark[row._id]?.trim()}
                                        className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Submit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowRejectModal({ ...showRejectModal, [row._id]: false })
                                          setRejectRemark({ ...rejectRemark, [row._id]: '' })
                                        }}
                                        className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:bg-slate-800"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onSaveRow(row)}
                                disabled={savingId === row._id}
                                className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {row._id.startsWith('temp-') ? 'Save' : 'Update'}
                              </button>
                              {/* Hide Sign Off button if status is 'accepted' or 'pending' */}
                              {row.signoffStatus !== 'pending' && row.signoffStatus !== 'accepted' && (
                                <button
                                  type="button"
                                  onClick={() => onRequestSignOff(row)}
                                  disabled={!row.sourceDepartment?.trim() || row._id.startsWith('temp-')}
                                  className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Sign Off
                                </button>
                              )}
                              {canDelete && row._id && !row._id.startsWith('temp-') ? (
                                <button
                                  type="button"
                                  onClick={() => onDeleteRow(row)}
                                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-500/20"
                                >
                                  Delete
                                </button>
                              ) : null}
                            </>
                          )}
                          {/* Show sign-off status and remarks */}
                          {row.signoffStatus && (
                            <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2 text-[0.65rem]">
                              <p className="uppercase tracking-[0.2em] text-slate-400">
                                Status: <span className={row.signoffStatus === 'accepted' ? 'text-green-400' : row.signoffStatus === 'rejected' ? 'text-red-400' : 'text-yellow-400'}>{row.signoffStatus}</span>
                              </p>
                              {row.signoffRemark && (
                                <p className="mt-1 text-slate-300">Remark: {row.signoffRemark}</p>
                              )}
                            </div>
                          )}
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


