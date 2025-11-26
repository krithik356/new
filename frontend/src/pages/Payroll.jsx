import { useCallback, useEffect, useMemo, useState } from 'react'

import SearchableSelect from '../components/SearchableSelect.jsx'
import { apiClient, ApiError } from '../services/apiClient.js'
import { useAuth } from '../providers/AuthProvider.jsx'

const COLUMN_DEFS = [
  { key: 'empId', label: 'EMP ID', type: 'text', required: true },
  { key: 'empName', label: 'EMP Name', type: 'text', required: true },
  { key: 'doj', label: 'DOJ', type: 'date', required: true },
  { key: 'doe', label: 'DOE', type: 'date' },
  { key: 'month', label: 'Month', type: 'month', required: true },
  { key: 'designation', label: 'Designation', type: 'text' },
  { key: 'departmentId', label: 'Department', type: 'department', required: true },
  { key: 'topDepartment', label: 'Top Department', type: 'text' },
  { key: 'type', label: 'Type', type: 'text' },
  { key: 'sourceDepartment', label: 'Source Department', type: 'text' },
  { key: 'beneficiaryDepartment', label: 'Beneficiary Department', type: 'text' },
  { key: 'sourceHod', label: 'Source HOD', type: 'text' },
  { key: 'beneficiaryHod', label: 'Beneficiary HOD', type: 'text' },
  { key: 'salary', label: 'Salary', type: 'number', required: true, step: '1000' },
  { key: 'wfoWfh', label: 'WFO/WFH', type: 'text' },
  { key: 'employeeType', label: 'Employee Type', type: 'text' },
  { key: 'academy', label: 'Academy', type: 'number', step: '0.01' },
  { key: 'intensive', label: 'Intensive', type: 'number', step: '0.01' },
  { key: 'niatBatch1And2', label: 'NIAT Batch 1 & 2', type: 'number', step: '0.01' },
  { key: 'niatBatch3', label: 'NIAT Batch 3', type: 'number', step: '0.01' },
  { key: 'niatBatch4', label: 'NIAT Batch 4', type: 'number', step: '0.01' },
  { key: 'others', label: 'Others', type: 'number', step: '0.01' },
  { key: 'common', label: 'Common', type: 'number', step: '0.01' },
]

function toDateInputValue(value) {
  if (!value) return ''
  return value.slice(0, 10)
}

function toMonthInputValue(value) {
  if (!value) return ''
  return value.slice(0, 7)
}

function getCurrentMonthValue() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

function createInitialRow(defaultDepartmentId = '') {
  const template = {}
  COLUMN_DEFS.forEach((column) => {
    if (column.type === 'month') {
      template[column.key] = getCurrentMonthValue()
    } else if (column.type === 'date') {
      template[column.key] = ''
    } else if (column.type === 'department') {
      template[column.key] = defaultDepartmentId || ''
    } else {
      template[column.key] = ''
    }
  })
  return template
}

function removeCellError(state, rowId, columnKey) {
  if (!state[rowId]?.[columnKey]) {
    return state
  }
  const next = { ...state }
  const cellErrors = { ...(next[rowId] ?? {}) }
  delete cellErrors[columnKey]
  if (Object.keys(cellErrors).length === 0) {
    delete next[rowId]
  } else {
    next[rowId] = cellErrors
  }
  return next
}

function removeDraftValue(drafts, rowId, columnKey) {
  if (!drafts[rowId]?.[columnKey]) {
    return drafts
  }
  const next = { ...drafts }
  const rowDraft = { ...(next[rowId] ?? {}) }
  delete rowDraft[columnKey]
  if (Object.keys(rowDraft).length === 0) {
    delete next[rowId]
  } else {
    next[rowId] = rowDraft
  }
  return next
}

function getBaseValue(row, column) {
  if (!row) return ''
  if (column.type === 'date') {
    return toDateInputValue(row[column.key]) || ''
  }
  if (column.type === 'month') {
    return toMonthInputValue(row[column.key]) || ''
  }
  if (column.type === 'department') {
    return row.departmentId || ''
  }
  const value = row[column.key]
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function getDisplayValue(row, column, drafts) {
  const draftRow = drafts[row.id]
  if (draftRow && Object.prototype.hasOwnProperty.call(draftRow, column.key)) {
    return draftRow[column.key]
  }
  return getBaseValue(row, column)
}

function coerceValueForApi(column, value) {
  if (column.type === 'number') {
    if (value === '' || value === null || value === undefined) {
      return null
    }
    return Number(value)
  }
  if (column.type === 'date' || column.type === 'month') {
    return value || null
  }
  if (column.type === 'department') {
    return value || null
  }
  if (typeof value !== 'string') {
    return value ?? null
  }
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function validateField(column, value, { requiredOverride } = {}) {
  const isRequired = requiredOverride ?? Boolean(column.required)
  if (column.type === 'number') {
    if ((value === '' || value === null || value === undefined) && !isRequired) {
      return null
    }
    if (value === '' || value === null || value === undefined) {
      return `${column.label} is required.`
    }
    const numberValue = Number(value)
    if (Number.isNaN(numberValue)) {
      return `${column.label} must be a number.`
    }
    if (numberValue < 0) {
      return `${column.label} cannot be negative.`
    }
    if (column.key === 'salary' && numberValue < 0) {
      return `${column.label} must be non-negative.`
    }
    return null
  }

  if (column.type === 'date') {
    if (!value) {
      return isRequired ? `${column.label} is required.` : null
    }
    if (Number.isNaN(Date.parse(value))) {
      return `${column.label} must be a valid date.`
    }
    return null
  }

  if (column.type === 'month') {
    if (!value) {
      return isRequired ? `${column.label} is required.` : null
    }
    return /^\d{4}-\d{2}$/.test(value) ? null : `${column.label} must match YYYY-MM.`
  }

  if (column.type === 'department') {
    if (!value) {
      return isRequired ? 'Department is required.' : null
    }
    return null
  }

  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return isRequired ? `${column.label} is required.` : null
  }

  return null
}

function hasFieldChanged(row, column, normalizedValue, rawValue) {
  if (column.type === 'number') {
    const existing = row[column.key]
    if (existing == null && (normalizedValue == null || normalizedValue === '')) {
      return false
    }
    return Number(existing ?? 0) !== Number(normalizedValue ?? 0)
  }
  if (column.type === 'date') {
    const existing = toDateInputValue(row[column.key])
    return (existing || '') !== (rawValue || '')
  }
  if (column.type === 'month') {
    const existing = toMonthInputValue(row[column.key])
    return (existing || '') !== (rawValue || '')
  }
  if (column.type === 'department') {
    return (row.departmentId || '') !== (rawValue || '')
  }
  const existing = row[column.key] ?? ''
  const next =
    typeof rawValue === 'string' ? rawValue.trim() : rawValue ?? ''
  return (existing ?? '') !== next
}

export default function PayrollPage() {
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const isHod = user?.role === 'HOD'
  const hodDepartmentId = user?.department?.id ?? ''
  const hodDepartmentName = user?.department?.name ?? 'No department assigned'

  const [departments, setDepartments] = useState([])
  const [departmentFilter, setDepartmentFilter] = useState(() => (isAdmin ? '' : hodDepartmentId))
  const [rows, setRows] = useState([])
  const [draftEdits, setDraftEdits] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingCells, setPendingCells] = useState(() => new Set())
  const [inlineErrors, setInlineErrors] = useState({})
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newRow, setNewRow] = useState(() => createInitialRow(isAdmin ? '' : hodDepartmentId))
  const [newRowErrors, setNewRowErrors] = useState({})
  const [addError, setAddError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [activeView, setActiveView] = useState('existing')

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function loadDepartments() {
      try {
        const response = await apiClient.getDepartments(token)
        if (cancelled) return
        const mapped =
          response.data?.map((dept) => ({
            id: dept._id || dept.id,
            name: dept.name,
            code: dept.code ?? '',
          })) ?? []
        setDepartments(mapped)
      } catch {
        if (!cancelled) {
          setDepartments([])
        }
      }
    }

    loadDepartments()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (isAdmin) {
      if (!departmentFilter && departments.length > 0) {
        setDepartmentFilter(departments[0].id)
      }
    } else if (isHod) {
      setDepartmentFilter(hodDepartmentId)
    }
  }, [isAdmin, isHod, departments, departmentFilter, hodDepartmentId])

  const loadPayrollRows = useCallback(async () => {
    if (!token) return
    if (isAdmin && !departmentFilter) {
      setRows([])
      setDraftEdits({})
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (isAdmin) {
        params.department = departmentFilter
      }
      const response = await apiClient.getExistingEmployeePayroll(token, params)
      setRows(response.data ?? [])
      setDraftEdits({})
    } catch (err) {
      setRows([])
      setDraftEdits({})
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Unable to load payroll sheet.')
      }
    } finally {
      setLoading(false)
    }
  }, [token, departmentFilter, isAdmin])

  useEffect(() => {
    loadPayrollRows()
  }, [loadPayrollRows])

  const departmentOptions = useMemo(
    () =>
      departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
      })),
    [departments]
  )

  const canEditRow = useCallback(
    (row) => {
      if (isAdmin) return true
      if (isHod) {
        return row.departmentId && hodDepartmentId
          ? row.departmentId === hodDepartmentId
          : false
      }
      return false
    },
    [isAdmin, isHod, hodDepartmentId]
  )

  const disabledTooltip = isAdmin
    ? ''
    : isHod
      ? 'HODs can only edit employees assigned to their department.'
      : 'You do not have permission to edit payroll rows.'

  const handleFieldChange = (row, column, value) => {
    setDraftEdits((prev) => {
      const baseValue = getBaseValue(row, column)
      const normalizedValue = value ?? ''
      const isSame =
        (normalizedValue === '' && baseValue === '') || normalizedValue === baseValue
      if (isSame && !prev[row.id]?.[column.key]) {
        return prev
      }
      const next = { ...prev }
      if (isSame) {
        return removeDraftValue(next, row.id, column.key)
      }
      next[row.id] = {
        ...(next[row.id] ?? {}),
        [column.key]: value,
      }
      return next
    })
    setInlineErrors((prev) => removeCellError(prev, row.id, column.key))
  }

  const handleCommit = async (row, column, rawValue) => {
    if (!canEditRow(row)) {
      return
    }
    const validationMessage = validateField(column, rawValue)
    if (validationMessage) {
      setInlineErrors((prev) => ({
        ...prev,
        [row.id]: {
          ...(prev[row.id] ?? {}),
          [column.key]: validationMessage,
        },
      }))
      return
    }

    const normalizedValue =
      column.type === 'department'
        ? rawValue || null
        : coerceValueForApi(column, rawValue)

    if (!hasFieldChanged(row, column, normalizedValue, rawValue)) {
      setDraftEdits((prev) => removeDraftValue(prev, row.id, column.key))
      return
    }

    const payload =
      column.type === 'department'
        ? { department: normalizedValue }
        : { [column.key]: normalizedValue }

    const cellKey = `${row.id}:${column.key}`
    setPendingCells((prev) => {
      const next = new Set(prev)
      next.add(cellKey)
      return next
    })

    try {
      const response = await apiClient.updateExistingEmployeePayroll(token, row.id, payload)
      setRows((prev) =>
        prev.map((entry) => (entry.id === row.id ? response.data : entry))
      )
      setDraftEdits((prev) => removeDraftValue(prev, row.id, column.key))
      setInlineErrors((prev) => removeCellError(prev, row.id, column.key))
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to save changes. Please try again.'
      setInlineErrors((prev) => ({
        ...prev,
        [row.id]: {
          ...(prev[row.id] ?? {}),
          [column.key]: message,
        },
      }))
    } finally {
      setPendingCells((prev) => {
        const next = new Set(prev)
        next.delete(cellKey)
        return next
      })
    }
  }

  const handleGenerateSheet = async () => {
    setExportError(null)
    if (isAdmin && !departmentFilter) {
      setExportError('Select a department to export.')
      return
    }
    setExporting(true)
    try {
      await apiClient.exportExistingEmployeePayrollSheet(token, {
        department: isAdmin ? departmentFilter : undefined,
      })
    } catch (err) {
      setExportError(
        err instanceof ApiError
          ? err.message
          : 'Unable to export the payroll sheet.'
      )
    } finally {
      setExporting(false)
    }
  }

  const openAddRowModal = () => {
    setNewRow(createInitialRow(isAdmin ? departmentFilter : hodDepartmentId))
    setNewRowErrors({})
    setAddError(null)
    setIsAddModalOpen(true)
  }

  const closeAddRowModal = () => {
    setIsAddModalOpen(false)
    setNewRowErrors({})
    setAddError(null)
  }

  const handleAddRowFieldChange = (column, value) => {
    setNewRow((prev) => ({
      ...prev,
      [column.key]: value,
    }))
    setNewRowErrors((prev) => {
      if (!prev[column.key]) return prev
      const next = { ...prev }
      delete next[column.key]
      return next
    })
  }

  const handleAddRowSubmit = async (event) => {
    event.preventDefault()
    const errors = {}
    COLUMN_DEFS.forEach((column) => {
      const value = newRow[column.key]
      const message = validateField(column, value, {
        requiredOverride:
          column.type === 'department'
            ? isAdmin
            : column.required,
      })
      if (message) {
        errors[column.key] = message
      }
    })

    if (!isAdmin && !hodDepartmentId) {
      errors.departmentId = 'Department is required.'
    }

    if (Object.keys(errors).length > 0) {
      setNewRowErrors(errors)
      return
    }

    setAdding(true)
    setAddError(null)

    const payload = COLUMN_DEFS.reduce((acc, column) => {
      if (column.type === 'department') {
        if (isAdmin) {
          acc.department = newRow.departmentId || null
        }
      } else {
        acc[column.key] = coerceValueForApi(column, newRow[column.key])
      }
      return acc
    }, {})

    try {
      await apiClient.createExistingEmployeePayroll(token, payload)
      setIsAddModalOpen(false)
      setNewRow(createInitialRow(isAdmin ? departmentFilter : hodDepartmentId))
      setNewRowErrors({})
      await loadPayrollRows()
    } catch (err) {
      setAddError(
        err instanceof ApiError ? err.message : 'Unable to add the payroll row.'
      )
    } finally {
      setAdding(false)
    }
  }

  const rowsEmptyState =
    !isAdmin || departmentFilter
      ? 'No payroll rows found for the selected department.'
      : 'Select a department to view payroll rows.'

  return (
    <section className="space-y-10">
      <header className="space-y-6 rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-950/80 to-slate-900/40 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">Payroll</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">Payroll Operations</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Switch between the legacy employee payroll view and the brand-new New Joinee payroll sheet.
              Existing payroll systems stay conflict-free while Source and Beneficiary teams keep total visibility.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">Source</span>
            <span className="px-3 py-1 text-slate-500">Beneficiary</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex overflow-hidden rounded-full border border-slate-800/70 bg-slate-900/40 text-sm font-semibold text-slate-400">
            {['existing', 'new'].map((viewKey) => (
              <button
                key={viewKey}
                type="button"
                onClick={() => setActiveView(viewKey)}
                className={`flex-1 px-6 py-2 transition ${
                  activeView === viewKey
                    ? 'bg-emerald-500/20 text-emerald-100'
                    : 'hover:text-slate-200'
                }`}
              >
                {viewKey === 'existing' ? 'Existing Employees' : 'New Joinees'}
              </button>
            ))}
          </div>

          <div className="flex gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span className="rounded-full border border-emerald-500/50 px-4 py-1 text-emerald-100">
              Tech HOD
            </span>
            <span className="rounded-full border border-slate-700 px-4 py-1">{user?.role ?? 'HOD'}</span>
          </div>
        </div>
      </header>

      {activeView === 'existing' ? (
        <>
          <section className="space-y-6 rounded-3xl border border-slate-800/70 bg-slate-950/50 p-6 shadow-inner shadow-black/30">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">Existing Employees</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-50">Operational Sheet</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Maintain live payroll edits for every deployed teammate. All updates respect Source/Bene permissions instantly.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isAdmin ? (
                  <div className="w-full sm:w-64">
                    <SearchableSelect
                      id="existing-payroll-department"
                      label="Department"
                      value={departmentFilter}
                      onChange={(selection) => setDepartmentFilter(selection)}
                      options={departmentOptions}
                      placeholder="Choose department"
                      searchPlaceholder="Search departments..."
                      emptyLabel="No departments found"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">HOD Department Scope</p>
                    <p className="mt-1 text-base font-semibold text-slate-50">{hodDepartmentName}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openAddRowModal}
                  disabled={isHod && !hodDepartmentId}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Add Row
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSheet}
                  disabled={exporting || (isAdmin && !departmentFilter)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exporting ? 'Generating…' : 'Generate Sheet'}
                </button>
              </div>
            </div>
            {exportError ? <p className="text-sm text-red-300">{exportError}</p> : null}
          </section>

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/40 p-6 shadow-inner shadow-black/30">
            {error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-6 text-sm text-red-200">
                {error}
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-900/60" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-6 text-sm text-slate-400">
                {rowsEmptyState}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-emerald-200">
                  <p>HOD view always scopes to your department.</p>
                  <button
                    type="button"
                    onClick={loadPayrollRows}
                    className="text-emerald-300 transition hover:text-emerald-100"
                  >
                    Refresh
                  </button>
                </div>
                <table className="min-w-[1200px] w-full border-separate border-spacing-0 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                  <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur">
                    <tr>
                      {COLUMN_DEFS.map((column) => (
                        <th key={column.key} className="px-3 py-4 font-semibold">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[13px] normal-case tracking-normal text-slate-100">
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-slate-900/40 transition hover:bg-slate-900/50">
                        {COLUMN_DEFS.map((column) => {
                          const cellKey = `${row.id}:${column.key}`
                          const pending = pendingCells.has(cellKey)
                          const value = getDisplayValue(row, column, draftEdits)
                          const isEditable = canEditRow(row)
                          const errorMessage = inlineErrors[row.id]?.[column.key]

                          const commonProps = {
                            id: `${row.id}-${column.key}`,
                            name: column.key,
                            value: value ?? '',
                            disabled: !isEditable,
                            title: !isEditable ? disabledTooltip : undefined,
                            onBlur: (event) => handleCommit(row, column, event.target.value),
                            onKeyDown: (event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                handleCommit(row, column, event.currentTarget.value)
                              }
                            },
                            className:
                              'w-full rounded-xl border border-slate-800/70 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:bg-slate-900/30 disabled:text-slate-500',
                          }

                          let inputElement = null

                          if (column.type === 'department') {
                            inputElement = (
                              <select
                                {...commonProps}
                                onChange={(event) => handleFieldChange(row, column, event.target.value)}
                              >
                                <option value="">Select</option>
                                {departmentOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            )
                          } else if (column.type === 'number') {
                            inputElement = (
                              <input
                                {...commonProps}
                                type="number"
                                step={column.step ?? '1'}
                                onChange={(event) => handleFieldChange(row, column, event.target.value)}
                              />
                            )
                          } else if (column.type === 'date') {
                            inputElement = (
                              <input
                                {...commonProps}
                                type="date"
                                onChange={(event) => handleFieldChange(row, column, event.target.value)}
                              />
                            )
                          } else if (column.type === 'month') {
                            inputElement = (
                              <input
                                {...commonProps}
                                type="month"
                                onChange={(event) => handleFieldChange(row, column, event.target.value)}
                              />
                            )
                          } else {
                            inputElement = (
                              <input
                                {...commonProps}
                                type="text"
                                onChange={(event) => handleFieldChange(row, column, event.target.value)}
                              />
                            )
                          }

                          return (
                            <td key={column.key} className="px-3 py-3 align-top">
                              <div className="space-y-1">
                                <div className="relative">
                                  {pending ? (
                                    <div className="absolute inset-0 animate-pulse rounded-xl bg-emerald-500/10" aria-hidden="true" />
                                  ) : null}
                                  {inputElement}
                                </div>
                                {errorMessage ? (
                                  <p className="text-[11px] text-red-300">{errorMessage}</p>
                                ) : null}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8 text-slate-100 shadow-inner shadow-black/30">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">New Joinees</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-50">New Joinee Payroll Sheet</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">
                Maintain upcoming joinees, hardware logistics, and approvals in one collaborative sheet.
                This placeholder view keeps the layout consistent until the dedicated new joinee data source arrives.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-emerald-500/60 px-4 py-2 text-emerald-100">HOD Department Scope</span>
              <span className="rounded-full border border-slate-700 px-4 py-2 text-slate-300">Coming Soon</span>
            </div>
          </div>
          <div className="mt-10 rounded-2xl border border-dashed border-slate-800/70 bg-slate-950/40 p-6 text-sm text-slate-500">
            Placeholder content for the new joinee sheet. Hook your data source here once ready.
          </div>
        </section>
      )}

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-800/70 bg-slate-900/90 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Add row</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-50">Existing employee payroll</h2>
              </div>
              <button
                type="button"
                onClick={closeAddRowModal}
                className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form id="add-payroll-row" onSubmit={handleAddRowSubmit} className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              <div className="grid gap-4 md:grid-cols-2">
                {COLUMN_DEFS.map((column) => (
                  <label key={column.key} className="space-y-2 text-sm text-slate-200">
                    <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">
                      {column.label}
                    </span>
                    {column.type === 'department' ? (
                      isAdmin ? (
                        <select
                          value={newRow.departmentId}
                          onChange={(event) => handleAddRowFieldChange(column, event.target.value)}
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-50 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        >
                          <option value="">Select department</option>
                          {departmentOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={hodDepartmentName}
                          disabled
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-slate-400"
                        />
                      )
                    ) : column.type === 'number' ? (
                      <input
                        type="number"
                        step={column.step ?? '1'}
                        value={newRow[column.key]}
                        onChange={(event) => handleAddRowFieldChange(column, event.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-50 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    ) : column.type === 'date' ? (
                      <input
                        type="date"
                        value={newRow[column.key]}
                        onChange={(event) => handleAddRowFieldChange(column, event.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-50 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    ) : column.type === 'month' ? (
                      <input
                        type="month"
                        value={newRow[column.key]}
                        onChange={(event) => handleAddRowFieldChange(column, event.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-50 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    ) : (
                      <input
                        type="text"
                        value={newRow[column.key]}
                        onChange={(event) => handleAddRowFieldChange(column, event.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-50 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    )}
                    {newRowErrors[column.key] ? (
                      <p className="text-xs text-red-300">{newRowErrors[column.key]}</p>
                    ) : null}
                  </label>
                ))}
              </div>
            </form>
            {addError ? <p className="mt-4 text-sm text-red-300">{addError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAddRowModal}
                className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-payroll-row"
                disabled={adding}
                className="rounded-2xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? 'Saving…' : 'Save row'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
