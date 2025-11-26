import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'
import NonPayrollToolbar from '../../components/nonPayroll/NonPayrollToolbar.jsx'
import NonPayrollTable from '../../components/nonPayroll/NonPayrollTable.jsx'
import { NonPayrollAPI } from '../../api/nonPayroll.js'

const TYPE_OPTIONS = ['CapEx', 'OpEx']
const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const COLUMN_DEFINITIONS = [
  { key: 'uniqueId', label: 'Unique ID', width: 200, input: 'text' },
  { key: 'responsibleDepartment', label: 'Responsible Department', width: 220, input: 'text' },
  { key: 'beneficiaryDepartment', label: 'Beneficiary Department', width: 220, input: 'text' },
  { key: 'responsibleDepartmentHod', label: 'Responsible Department HOD', width: 240, input: 'text' },
  { key: 'beneficiaryDepartmentHod', label: 'Beneficiary Department HOD', width: 240, input: 'text' },
  { key: 'type', label: 'Type', width: 140, input: 'select-type' },
  { key: 'vendor', label: 'Vendor', width: 200, input: 'text' },
  { key: 'description', label: 'Description', width: 260, input: 'textarea', rows: 2 },
  { key: 'category', label: 'Category', width: 180, input: 'text' },
  { key: 'product', label: 'Product', width: 180, input: 'text' },
  { key: 'serviceStartDate', label: 'Service Start Date', width: 180, input: 'date' },
  { key: 'serviceEndDate', label: 'Service End Date', width: 180, input: 'date' },
  { key: 'serviceDurationDays', label: 'Service Duration', width: 160, input: 'readonly', readOnly: true },
  {
    key: 'budgetedPaymentAmountExcGst',
    label: 'Budgeted Payment Amount (Exc GST)',
    width: 240,
    input: 'number',
  },
  { key: 'gstAmount', label: 'GST Amount', width: 160, input: 'number' },
  {
    key: 'budgetedPaymentAmountInclGst',
    label: 'Budgeted Payment Amount (Incl GST)',
    width: 240,
    input: 'readonly',
    readOnly: true,
  },
  {
    key: 'dueMonthForPayment',
    label: 'Due Month for Payment',
    width: 200,
    input: 'select-month',
  },
]

const REQUIRED_FIELDS = [
  'uniqueId',
  'responsibleDepartment',
  'beneficiaryDepartment',
  'responsibleDepartmentHod',
  'beneficiaryDepartmentHod',
  'type',
  'vendor',
  'description',
  'category',
  'product',
  'budgetedPaymentAmountExcGst',
  'gstAmount',
]

const NUMERIC_FIELDS = ['budgetedPaymentAmountExcGst', 'gstAmount']
const DATE_FIELDS = ['serviceStartDate', 'serviceEndDate']
const READ_ONLY_KEYS = new Set(['serviceDurationDays', 'budgetedPaymentAmountInclGst'])

const HEADER_BY_KEY = COLUMN_DEFINITIONS.reduce((acc, column) => {
  acc[column.key] = column.label
  return acc
}, {})

const createRowId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

const formatDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const calculateDuration = (start, end) => {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return ''
  const diff = Math.floor((endDate - startDate) / 86400000)
  return diff >= 0 ? diff : ''
}

const calculateInclGst = (exc, gst) => {
  const excValue = Number.parseFloat(exc)
  const gstValue = Number.parseFloat(gst || 0)
  if (Number.isNaN(excValue)) {
    return ''
  }
  const total = (Number.isNaN(gstValue) ? 0 : gstValue) + excValue
  return Number.isNaN(total) ? '' : Number(total.toFixed(2))
}

const normalizeRecord = (record) => {
  const normalized = { _id: record.id ?? record._id ?? `temp-${createRowId()}` }
  COLUMN_DEFINITIONS.forEach((column) => {
    if (DATE_FIELDS.includes(column.key)) {
      normalized[column.key] = formatDateInput(record[column.key])
    } else if (NUMERIC_FIELDS.includes(column.key) || column.key === 'budgetedPaymentAmountInclGst') {
      normalized[column.key] =
        record[column.key] === null || record[column.key] === undefined
          ? ''
          : Number(record[column.key]).toString()
    } else {
      normalized[column.key] = record[column.key] ?? ''
    }
  })
  normalized.serviceDurationDays =
    record.serviceDurationDays === null || record.serviceDurationDays === undefined
      ? ''
      : record.serviceDurationDays
  return normalized
}

const createEmptyRow = (role, departmentHint = '') =>
  normalizeRecord({
    _id: `temp-${createRowId()}`,
    responsibleDepartment: role === 'Admin' ? departmentHint : departmentHint || '',
  })

export default function NonPayrollSheet() {
  const { token, user } = useAuth()
  const role = user?.role ?? 'Member'
  const hodDepartmentName = user?.department?.name ?? ''
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)
  const [rowErrors, setRowErrors] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeDepartment, setActiveDepartment] = useState('all')
  const [selectedUploadFileName, setSelectedUploadFileName] = useState('')
  const fileInputRef = useRef(null)

  const isAdmin = role === 'Admin'

  const loadRows = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setErrorMessage(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? {
              department: activeDepartment,
            }
          : undefined
      const response = await NonPayrollAPI.fetchList(token, params)
      setRows((response.data ?? []).map((item) => normalizeRecord(item)))
      setRowErrors({})
    } catch (error) {
      console.error('Failed to load non-payroll records', error)
      const message =
        error instanceof ApiError ? error.message : error?.message ?? 'Unable to load the non-payroll sheet.'
      setErrorMessage(message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [token, isAdmin, activeDepartment])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const addRow = () => {
    const departmentHint = isAdmin && activeDepartment !== 'all' ? activeDepartment : hodDepartmentName
    const newRow = createEmptyRow(role, departmentHint)
    setRows((prev) => [newRow, ...prev])
  }

  const recalcDerivedFields = (row) => {
    const duration = calculateDuration(row.serviceStartDate, row.serviceEndDate)
    const total = calculateInclGst(row.budgetedPaymentAmountExcGst, row.gstAmount)
    return {
      serviceDurationDays: duration === '' ? '' : duration,
      budgetedPaymentAmountInclGst: total === '' ? '' : total,
    }
  }

  const updateRowErrors = (rowId, errors) => {
    setRowErrors((prev) => {
      if (!errors || Object.keys(errors).length === 0) {
        if (!prev[rowId]) {
          return prev
        }
        const next = { ...prev }
        delete next[rowId]
        return next
      }
      return {
        ...prev,
        [rowId]: {
          fields: errors,
          messages: Object.values(errors),
        },
      }
    })
  }

  const validateRow = (row, allRows = rows) => {
    const errors = {}

    REQUIRED_FIELDS.forEach((field) => {
      if (!row[field] || !row[field].toString().trim()) {
        errors[field] = `${HEADER_BY_KEY[field]} is required.`
      }
    })

    NUMERIC_FIELDS.forEach((field) => {
      if (!row[field]) {
        return
      }
      const numeric = Number(row[field])
      if (Number.isNaN(numeric) || numeric < 0) {
        errors[field] = `${HEADER_BY_KEY[field]} must be a valid number.`
      }
    })

    if (row.serviceStartDate && row.serviceEndDate) {
      const start = new Date(row.serviceStartDate)
      const end = new Date(row.serviceEndDate)
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
        errors.serviceEndDate = 'Service End Date must be greater than or equal to Service Start Date.'
      }
    }

    const trimmedUniqueId = row.uniqueId?.trim().toLowerCase()
    if (trimmedUniqueId) {
      const duplicate = allRows.some(
        (existing) =>
          existing._id !== row._id && existing.uniqueId?.trim().toLowerCase() === trimmedUniqueId
      )
      if (duplicate) {
        errors.uniqueId = 'Unique ID must be unique.'
      }
    }

    updateRowErrors(row._id, errors)
    return errors
  }

  const handleFieldChange = (rowId, field, value) => {
    setRows((prev) => {
      const nextRows = prev.map((row) => {
        if (row._id !== rowId) return row
        const nextRow = { ...row, [field]: value }
        if (DATE_FIELDS.includes(field) || NUMERIC_FIELDS.includes(field)) {
          const derived = recalcDerivedFields(nextRow)
          nextRow.serviceDurationDays = derived.serviceDurationDays
          nextRow.budgetedPaymentAmountInclGst = derived.budgetedPaymentAmountInclGst
        }
        return nextRow
      })
      const updatedRow = nextRows.find((row) => row._id === rowId)
      if (updatedRow) {
        validateRow(updatedRow, nextRows)
      }
      return nextRows
    })
  }

  const buildPayload = (row) => {
    const payload = {}
    COLUMN_DEFINITIONS.forEach((column) => {
      if (READ_ONLY_KEYS.has(column.key)) {
        return
      }
      if (DATE_FIELDS.includes(column.key)) {
        payload[column.key] = row[column.key] || null
        return
      }
      if (NUMERIC_FIELDS.includes(column.key)) {
        payload[column.key] =
          row[column.key] === '' || row[column.key] === null
            ? null
            : Number(parseFloat(row[column.key]).toFixed(2))
        return
      }
      payload[column.key] = row[column.key] ?? ''
    })

    payload.dueMonthForPayment = row.dueMonthForPayment || null
    return payload
  }

  const saveRow = async (row) => {
    const errors = validateRow(row, rows)
    if (errors && Object.keys(errors).length > 0) {
      setErrorMessage('Fix the highlighted fields before saving.')
      return
    }

    setSavingId(row._id)
    setErrorMessage(null)
    setInfoMessage(null)
    try {
      const payload = buildPayload(row)
      const response = row._id.startsWith('temp-')
        ? await NonPayrollAPI.create(token, payload)
        : await NonPayrollAPI.update(token, row._id, payload)
      setRows((prev) =>
        prev.map((existing) =>
          existing._id === row._id ? normalizeRecord(response.data) : existing
        )
      )
      setInfoMessage(row._id.startsWith('temp-') ? 'Row added successfully.' : 'Row updated successfully.')
      updateRowErrors(row._id, null)
    } catch (error) {
      console.error('Failed to save non-payroll row', error)
      const message =
        error instanceof ApiError ? error.message : error?.message ?? 'Unable to save the selected row.'
      setErrorMessage(message)
    } finally {
      setSavingId(null)
    }
  }

  const deleteRow = async (row) => {
    if (row._id.startsWith('temp-')) {
      setRows((prev) => prev.filter((entry) => entry._id !== row._id))
      updateRowErrors(row._id, null)
      return
    }
    try {
      await NonPayrollAPI.remove(token, row._id)
      setRows((prev) => prev.filter((entry) => entry._id !== row._id))
      updateRowErrors(row._id, null)
      setInfoMessage('Row deleted.')
    } catch (error) {
      console.error('Failed to delete non-payroll row', error)
      const message =
        error instanceof ApiError ? error.message : error?.message ?? 'Unable to delete the selected row.'
      setErrorMessage(message)
    }
  }

  const handleGenerateSheet = async () => {
    if (exporting) return
    setExporting(true)
    setErrorMessage(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? {
              department: activeDepartment,
            }
          : undefined
      await NonPayrollAPI.exportSheet(token, params)
    } catch (error) {
      console.error('Failed to export non-payroll sheet', error)
      const message =
        error instanceof ApiError ? error.message : error?.message ?? 'Unable to generate the non-payroll sheet.'
      setErrorMessage(message)
    } finally {
      setExporting(false)
    }
  }

  const handleUploadSheet = async (file) => {
    if (!file || uploading) return
    setUploading(true)
    setErrorMessage(null)
    setInfoMessage(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? {
              department: activeDepartment,
            }
          : undefined
      const response = await NonPayrollAPI.uploadSheet(token, file, params)
      setInfoMessage(response?.message ?? 'Upload completed.')
      await loadRows()
    } catch (error) {
      console.error('Failed to upload non-payroll sheet', error)
      const payload = error instanceof ApiError ? error.details : null
      if (payload?.errors?.length) {
        setErrorMessage(payload.errors.join('\n'))
      } else {
        const message =
          error instanceof ApiError ? error.message : error?.message ?? 'Unable to upload the non-payroll sheet.'
        setErrorMessage(message)
      }
    } finally {
      setUploading(false)
      setSelectedUploadFileName('')
    }
  }

  const errorSummaryList = useMemo(() => {
    return Object.values(rowErrors).flatMap((entry) => entry.messages || [])
  }, [rowErrors])

  const handleUploadButton = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      event.target.value = ''
      return
    }
    setSelectedUploadFileName(file.name)
    await handleUploadSheet(file)
    event.target.value = ''
  }

  const clearSelectedFile = () => {
    setSelectedUploadFileName('')
  }

  return (
    <section className="space-y-6">
      <NonPayrollToolbar
        role={role}
        activeDepartment={activeDepartment}
        onDepartmentChange={setActiveDepartment}
        onAddRow={addRow}
        onGenerateSheet={handleGenerateSheet}
        onUploadClick={handleUploadButton}
        loading={loading}
        exporting={exporting}
        uploading={uploading}
        selectedFileName={selectedUploadFileName}
        onClearSelectedFile={clearSelectedFile}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {infoMessage ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {infoMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 whitespace-pre-line">
          {errorMessage}
        </div>
      ) : null}

      {errorSummaryList.length > 0 ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200">
          <p className="text-xs uppercase tracking-[0.4em] text-red-300">Validation</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorSummaryList.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <NonPayrollTable
        columns={COLUMN_DEFINITIONS}
        rows={rows}
        loading={loading}
        savingId={savingId}
        rowErrors={rowErrors}
        onFieldChange={handleFieldChange}
        onSaveRow={saveRow}
        onDeleteRow={deleteRow}
        typeOptions={TYPE_OPTIONS}
        monthOptions={MONTH_OPTIONS}
      />
    </section>
  )
}


