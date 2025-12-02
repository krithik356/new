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

const TOP_DEPARTMENT_OPTIONS = [
  '10xIIT',
  'Academy Student Success',
  'AS - Program Registration Expert',
  'B2B Partnership',
  'Brand Marketing',
  'Business Operations',
  'CD - Curriculum Development',
  'Content and Curriculum Development: Aptitude, English and Assessments',
  'Content Development',
  'CT',
  'Data Science and Machine Learning',
  'Design Studio',
  'Finance & Legal',
  "Founder's Office",
  'GenAI Social Media',
  'HR - Human Resources',
  'HR - Talent Acquisition',
  'Intensive Student Success',
  'Internal Audit',
  'NIAT Hostel Facilities Team',
  'NIAT_Academics',
  'NIFA',
  'NxtWave Abroad',
  'NxtWave Edge - Colleges',
  'Placement Success Management',
  'Placement Support Team',
  'Pre Sales',
  'Product',
  'QR - Query Resolution',
  'Sales',
  'Student Success',
  'Tech Team',
  'University Partnerships',
  'Video House',
]

const HOD_OPTIONS = [
  'Srikar Naidu Edumudi (NW0001283)',
  'Vamshi Gadagoju (NW0001169)',
  'Anil Kumar Ganguri (NW0000311)',
  'Mansoor Valli Gangupalli (NW0000320)',
  'Girish Akash Yeshwanth Karri (NW0000306)',
  'Nikita Aggarwal (NW0001916)',
  'Shivam Singh (NW0001089)',
  'Pavan Gangireddy (NW0002526)',
  'Sai teja Manchukanti',
  'Sashank Reddy Gujjula (NW0000002)',
  'Rahul Attuluri (NW0000001)',
  'Rushikesh Konapure (NW0005433)',
  'Akhil Jogiparthi (NW0000305)',
  'Aman Maheshwari (NW0003000)',
  'Penmetsa Anirudh Varma (NW0003518)',
  'Devansh Mohata (NW0002722)',
  'Megha Ahuja (NW0002812)',
  'Rahul Yenninti (NW0001673)',
  'Bala Bhaskar Reddy Dodda (NW0001170)',
  'Radha Alekhya Kommanaboina (NW0001565)',
  'Munagala Varun Reddy (NW0002247)',
  'Divya Sri Nandigam (NW0001670)',
  'Brahma Reddy Karumuru (NW0001637)',
  'Hari Haran Gorijavola (NW0000390)',
  'Aniketh Mustoor (NW0000307)',
  'Sashank K (NW0002724)',
  'Venkata Abhinav Devaguptapu (NW0000351)',
  'Sai Teja Manchukanti (NW0000352)',
  'Kompella Sai Manvish (NW0005113)',
  'Pavan Reddy Dharma (NW0001171)',
  'Shiva Shanker Reddy Devasani (NW0000302)',
  'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  'Kadari Hari Krishna (NW0005153)',
  'Revanth Gopi Konakanchi (NW0000075)',
  'Tathagat Bisoyi (NW0003607)',
  'Kumar Verma (NW0001266)',
  'Sai Sumanth Reddy Gattikoppula (NW0000301)',
  'Karthik Reddy Vummadi (NW0000308)',
  'Joiet Joseph (NW0002644)',
]

const HOD_BY_TOP_DEPARTMENT = {
  '10xIIT': 'Srikar Naidu Edumudi (NW0001283)',
  'Academy Student Success': 'Vamshi Gadagoju (NW0001169)',
  'AS - Program Registration Expert': 'Anil Kumar Ganguri (NW0000311)',
  'B2B Partnership': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Brand Marketing': 'Nikita Aggarwal (NW0001916)',
  'Business Operations': 'Shivam Singh (NW0001089)',
  'CD - Curriculum Development': 'Pavan Gangireddy (NW0002526)',
  'Content and Curriculum Development: Aptitude, English and Assessments':
    'Sai teja Manchukanti',
  'Content Development': 'Sashank Reddy Gujjula (NW0000002)',
  CT: 'Rahul Attuluri (NW0000001)',
  'Data Science and Machine Learning': 'Akhil Jogiparthi (NW0000305)',
  'Design Studio': 'Aman Maheshwari (NW0003000)',
  'Finance & Legal': 'Penmetsa Anirudh Varma (NW0003518)',
  "Founder's Office": 'Rahul Attuluri (NW0000001)',
  'GenAI Social Media': 'Rahul Yenninti (NW0001673)',
  'HR - Human Resources': 'Radha Alekhya Kommanaboina (NW0001565)',
  'HR - Talent Acquisition': 'Hari Haran Gorijavola (NW0000390)',
  'Intensive Student Success': 'Aniketh Mustoor (NW0000307)',
  'Internal Audit': 'Radha Alekhya Kommanaboina (NW0001565)',
  'NIAT Hostel Facilities Team': 'Anil Kumar Ganguri (NW0000311)',
  NIAT_Academics: 'Aniketh Mustoor (NW0000307)',
  NIFA: 'Akhil Jogiparthi (NW0000305)',
  'NxtWave Abroad': 'Shiva Shanker Reddy Devasani (NW0000302)',
  'NxtWave Edge - Colleges': 'Srikar Naidu Edumudi (NW0001283)',
  'Placement Success Management': 'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  'Placement Support Team': 'Girish Akash Yeshwanth Karri (NW0000306)',
  'Pre Sales': 'Shiva Shanker Reddy Devasani (NW0000302)',
  Product: 'Revanth Gopi Konakanchi (NW0000075)',
  'QR - Query Resolution': 'Vishnu Vamsi Vardhan Tallam (NW0000088)',
  Sales: 'Sai Sumanth Reddy Gattikoppula (NW0000301)',
  'Student Success': 'Aniketh Mustoor (NW0000307)',
  'Tech Team': 'Revanth Gopi Konakanchi (NW0000075)',
  'University Partnerships': 'Karthik Reddy Vummadi (NW0000308)',
  'Video House': 'Joiet Joseph (NW0002644)',
}

const COLUMN_DEFINITIONS = [
  { key: 'uniqueId', label: 'Unique ID', width: 200, input: 'text' },
  {
    key: 'responsibleDepartment',
    label: 'Responsible Department',
    width: 220,
    input: 'select-department',
  },
  {
    key: 'beneficiaryDepartment',
    label: 'Beneficiary Department',
    width: 220,
    input: 'select-department',
  },
  {
    key: 'responsibleDepartmentHod',
    label: 'Responsible Department HOD',
    width: 240,
    input: 'select-hod',
  },
  {
    key: 'beneficiaryDepartmentHod',
    label: 'Beneficiary Department HOD',
    width: 240,
    input: 'select-hod',
  },
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
  { key: 'gstRate', label: 'GST Rate (%)', width: 140, input: 'number' },
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
  'gstRate',
  'gstAmount',
]

const NUMERIC_FIELDS = ['budgetedPaymentAmountExcGst', 'gstRate', 'gstAmount']
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

const formatDuration = (days) => {
  if (days === '' || days === null || days === undefined) return ''
  const totalDays = Number(days)
  if (Number.isNaN(totalDays) || totalDays < 0) return ''
  if (totalDays === 0) return '0 days'
  
  // Approximate months (using 30 days per month for simplicity)
  const months = Math.floor(totalDays / 30)
  const remainingDays = totalDays % 30
  
  const parts = []
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
  }
  if (remainingDays > 0) {
    parts.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`)
  }
  
  return parts.length > 0 ? parts.join(' ') : '0 days'
}

const calculateDuration = (start, end) => {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return ''
  const diff = Math.floor((endDate - startDate) / 86400000)
  if (diff < 0) return ''
  return diff.toString()
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

const calculateGstFromRate = (exc, rate) => {
  const excValue = Number.parseFloat(exc)
  const rateValue = Number.parseFloat(rate)
  if (Number.isNaN(excValue) || Number.isNaN(rateValue)) {
    return ''
  }
  const gst = excValue * (rateValue / 100)
  return Number.isNaN(gst) ? '' : Number(gst.toFixed(2))
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
      : String(record.serviceDurationDays)
  normalized.serviceDurationFormatted = formatDuration(normalized.serviceDurationDays)
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
  const [editMode, setEditMode] = useState(false)
  const fileInputRef = useRef(null)

  const isAdmin = role === 'Admin'
  const canEdit = role === 'Admin' || role === 'HOD'

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
    if (!canEdit) return
    // Match New Joinee behaviour: automatically switch to edit mode when adding a row
    if (!editMode) {
      setEditMode(true)
    }
    const departmentHint = isAdmin && activeDepartment !== 'all' ? activeDepartment : hodDepartmentName
    const newRow = createEmptyRow(role, departmentHint)
    setRows((prev) => [newRow, ...prev])
  }

  const recalcDerivedFields = (row) => {
    const duration = calculateDuration(row.serviceStartDate, row.serviceEndDate)
    let gstAmount = row.gstAmount
    const autoGst =
      row.budgetedPaymentAmountExcGst !== '' && row.gstRate !== ''
        ? calculateGstFromRate(row.budgetedPaymentAmountExcGst, row.gstRate)
        : ''
    if (autoGst !== '') {
      gstAmount = autoGst.toString()
    }
    const total = calculateInclGst(row.budgetedPaymentAmountExcGst, gstAmount)
    return {
      serviceDurationDays: duration,
      serviceDurationFormatted: formatDuration(duration),
      gstAmount,
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
    if (!editMode || !canEdit) return
    setRows((prev) => {
      const nextRows = prev.map((row) => {
        if (row._id !== rowId) return row
        const nextRow = { ...row, [field]: value }
        if (DATE_FIELDS.includes(field) || NUMERIC_FIELDS.includes(field)) {
          const derived = recalcDerivedFields(nextRow)
          nextRow.serviceDurationDays = derived.serviceDurationDays
          nextRow.serviceDurationFormatted = derived.serviceDurationFormatted
          nextRow.gstAmount = derived.gstAmount
          nextRow.budgetedPaymentAmountInclGst = derived.budgetedPaymentAmountInclGst
        }
        return nextRow
      })
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
    if (!editMode || !canEdit) return
    // Validate the row before saving
    const errors = validateRow(row, rows)
    if (errors && Object.keys(errors).length > 0) {
      setErrorMessage('Please fix the validation errors highlighted below before saving.')
      // Scroll to the first error if possible
      const firstErrorField = Object.keys(errors)[0]
      const errorContainer = document.querySelector(`[data-row-id="${row._id}"][data-field="${firstErrorField}"]`)
      if (errorContainer) {
        const inputElement = errorContainer.querySelector('input, select, textarea')
        if (inputElement) {
          setTimeout(() => {
            inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            inputElement.focus()
          }, 100)
        }
      }
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
      // Clear validation errors on successful save
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
    if (!editMode || !canEdit) return
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

  const sheetDescription = useMemo(() => {
    if (isAdmin) {
      if (activeDepartment === 'all') {
        return 'Viewing non-payroll entries for all departments.'
      }
      return `Filtering non-payroll entries for ${activeDepartment.toUpperCase()}.`
    }
    return 'HOD view always scopes to your department.'
  }, [activeDepartment, isAdmin])

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

      <div className="flex items-center justify-between rounded-3xl border border-slate-900/60 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        <p>{sheetDescription}</p>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-400/50 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/20 hover:text-blue-100"
            >
              {editMode ? 'View Mode' : 'Edit'}
            </button>
          )}
          <button
            type="button"
            onClick={loadRows}
            className="text-xs uppercase tracking-[0.4em] text-emerald-300 underline decoration-dotted underline-offset-4"
          >
            Refresh
          </button>
        </div>
      </div>

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
        departmentOptions={TOP_DEPARTMENT_OPTIONS}
        hodOptions={HOD_OPTIONS}
        hodByTopDepartment={HOD_BY_TOP_DEPARTMENT}
        isReadOnlySheet={!editMode || !canEdit}
      />
    </section>
  )
}


