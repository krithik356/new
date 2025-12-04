import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'
import { useViewMode } from '../../providers/ViewModeProvider.jsx'
import { NewJoineePayrollAPI } from '../../api/newJoineePayroll.js'
import { TARequirementAPI } from '../../api/taRequirements.js'
import NewJoineeToolbar from '../../components/payroll/new-joinees/NewJoineeToolbar.jsx'
import NewJoineeTable from '../../components/payroll/new-joinees/NewJoineeTable.jsx'
import TARequirementsTable from '../../components/payroll/ta-requirements/TARequirementsTable.jsx'

const COLUMN_DEFINITIONS = [
  { key: 'employeeName', label: 'EMP Name', width: '200px' },
  { key: 'doj', label: 'DOJ', width: '140px' },
  { key: 'designation', label: 'Designation', width: '180px' },
  { key: 'departmentLabel', label: 'Department', width: '180px' },
  { key: 'topDepartment', label: 'Top Department', width: '180px' },
  { key: 'type', label: 'Type', width: '140px' },
  { key: 'sourceDepartment', label: 'Source Department', width: '200px' },
  { key: 'beneficiaryDepartment', label: 'Beneficiary Department', width: '200px' },
  { key: 'sourceHod', label: 'Source HOD', width: '180px' },
  { key: 'beneficiaryHod', label: 'Beneficiary HOD', width: '200px' },
  { key: 'workMode', label: 'WFO/WFH', width: '140px' },
  { key: 'workLocation', label: 'Work Location', width: '180px' },
  { key: 'employmentType', label: 'Employment Type', width: '180px' },
  { key: 'remarks', label: 'Employment Type Remarks', width: '200px' },
  { key: 'ctcRange', label: 'CTC Range', width: '160px' },
  { key: 'experienceRange', label: 'Experience Range', width: '160px' },
  { key: 'newType', label: 'New Type', width: '150px' },
  { key: 'hiringStatus', label: 'Hiring Status', width: '160px' },
  { key: 'replacementEmployeeName', label: 'Replacement Employee Name', width: '220px' },
  { key: 'productOrDomain', label: 'Product / Working Domain', width: '220px' },
  {
    key: 'assetRequirement',
    label: 'Asset we have to provide',
    width: '220px',
  },
  { key: 'processor', label: 'Processor', width: '150px' },
  { key: 'operatingSystem', label: 'Operating System', width: '170px' },
  { key: 'storage', label: 'Storage (SSD)', width: '150px' },
  { key: 'ram', label: 'RAM', width: '120px' },
  { key: 'graphicCard', label: 'Graphic Card', width: '150px' },
  { key: 'peripherals', label: 'Peripherals', width: '150px' },
  { key: 'headPhone', label: 'Head Phone', width: '150px' },
  { key: 'scienceSbu', label: 'Science (SBU)', width: '150px' },
  { key: 'budgetAmount', label: 'Budget Amount', width: '150px' },
  { key: 'academy', label: 'Academy %', width: '130px' },
  { key: 'intensive', label: 'Intensive %', width: '130px' },
  { key: 'niatBatch1', label: 'NIAT Batch 1 %', width: '150px' },
  { key: 'niatBatch2', label: 'NIAT Batch 2 %', width: '150px' },
  { key: 'niatBatch3', label: 'NIAT Batch 3 %', width: '150px' },
  { key: 'others', label: 'Other Percentage', width: '150px' },
  { key: 'common', label: 'Common Percentage', width: '220px' },
]

const TA_COLUMN_DEFINITIONS = [
  { key: 'hodName', label: 'HOD Name', width: '200px' },
  { key: 'hiringManagerName', label: 'Hiring Manager Name', width: '220px' },
  { key: 'roleName', label: 'Role Name', width: '200px' },
  { key: 'noOfPositions', label: 'No of Positions', width: '180px' },
  { key: 'januaryPositions', label: 'Jan Positions', width: '160px' },
  { key: 'februaryPositions', label: 'Feb Positions', width: '160px' },
  { key: 'marchPositions', label: 'March Positions', width: '160px' },
  { key: 'minCTC', label: 'Min CTC (LPA)', width: '160px' },
  { key: 'maxCTC', label: 'Max CTC (LPA)', width: '160px' },
  { key: 'workLocation', label: 'Work Location', width: '200px' },
  { key: 'employmentType', label: 'Employment Type', width: '200px' },
  {
    key: 'employmentTypeRemarks',
    label: 'Employment Type Remarks',
    width: '240px',
  },
  { key: 'topDepartment', label: 'Top Department', width: '200px' },
  { key: 'department', label: 'Dept', width: '200px' },
  {
    key: 'beneficiaryDepartment',
    label: 'Beneficiary Department / POD Dept',
    width: '260px',
  },
  { key: 'experienceRange', label: 'Experience Range', width: '200px' },
  { key: 'hireType', label: 'Hire Type', width: '160px' },
  { key: 'hiringStatus', label: 'Hiring Status', width: '160px' },
  {
    key: 'replacementEmployeeName',
    label: 'Replacement Employee Name (Only for replacement hires)',
    width: '320px',
  },
  { key: 'productWorkingOn', label: 'Product Working On', width: '240px' },
  { key: 'jdLink', label: 'JD Link', width: '220px' },
  {
    key: 'assetToProvide',
    label: 'Asset we have to provide',
    width: '220px',
  },
  { key: 'processor', label: 'Processor', width: '160px' },
  { key: 'operatingSystem', label: 'Operating System', width: '200px' },
  { key: 'storage', label: 'Storage (SSD)', width: '170px' },
  { key: 'ram', label: 'RAM', width: '120px' },
  { key: 'displaySize', label: 'Display Size', width: '160px' },
  {
    key: 'graphicCard',
    label: 'Graphic Card (GPU) – optional',
    width: '240px',
  },
  { key: 'peripherals', label: 'Peripherals', width: '160px' },
  { key: 'ipad', label: 'iPad', width: '140px' },
  { key: 'headphones', label: 'Headphones', width: '160px' },
  { key: 'mobilePhones', label: 'Mobile Phones', width: '180px' },
  { key: 'externalSsds', label: 'External SSDs', width: '180px' },
  { key: 'budgetAmount', label: 'Budget Amount', width: '180px' },
]

const PERCENTAGE_FIELDS = [
  'academy',
  'intensive',
  'niatBatch1',
  'niatBatch2',
  'niatBatch3',
  'others',
]

const SALES_KEY = 'sales'

const parsePercentageValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = parseFloat(value)
  if (Number.isNaN(parsed)) {
    return null
  }
  // Support both whole percentages (40) and Excel-style decimals (0.4)
  if (parsed > 0 && parsed <= 1 && !value.toString().includes('%')) {
    return Number((parsed * 100).toFixed(2))
  }
  return parsed
}

const buildSearchableText = (row) => {
  const fieldsToIndex = [
    'employeeName',
    'empId',
    'designation',
    'departmentLabel',
    'topDepartment',
    'sourceDepartment',
    'beneficiaryDepartment',
    'sourceHod',
    'beneficiaryHod',
    'workLocation',
    'employmentType',
    'remarks',
    'ctcRange',
    'experienceRange',
    'newType',
    'replacementEmployeeName',
    'productOrDomain',
    'assetRequirement',
  ]

  return fieldsToIndex
    .map((field) => row[field])
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const validatePercentageRow = (row) => {
  const values = PERCENTAGE_FIELDS.map((field) =>
    parsePercentageValue(row[field])
  ).filter((value) => value !== null)

  if (values.length === 0) {
    return null
  }

  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total * 100) / 100 === 100
    ? null
    : 'Allocation percentages must equal 100%.'
}

const normalizeDepartment = (value) =>
  (value ?? '').toString().trim().toLowerCase()

const getDateValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const createRowId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const normalizeRow = (record) => {
  const row = {
    _id: record?._id ?? `temp-${createRowId()}`,
    departmentKey: record?.departmentKey ?? '',
    departmentId: record?.department ?? null,
  }

  COLUMN_DEFINITIONS.forEach(({ key }) => {
    if (key === 'doj') {
      row[key] = getDateValue(record?.[key])
    } else {
      row[key] = record?.[key] ?? ''
    }
  })

  return row
}

const createEmptyRow = (role, departmentKey = '') =>
  normalizeRow({
    _id: `temp-${createRowId()}`,
    departmentKey: role === 'Admin' ? departmentKey : '',
  })

export default function NewJoineeSheet() {
  const { token, user } = useAuth()
  const { mode } = useViewMode()
  const role = user?.role ?? 'Member'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [rowErrors, setRowErrors] = useState({})
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [search, setSearch] = useState('')
  const [activeDepartment, setActiveDepartment] = useState(
    role === 'Admin' ? 'all' : 'hod'
  )
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [taRows, setTaRows] = useState([])
  const [taLoading, setTaLoading] = useState(true)
  const [taError, setTaError] = useState(null)
  const [taSuccessMessage, setTaSuccessMessage] = useState(null)
  const [taSavingId, setTaSavingId] = useState(null)
  const [taRowErrors, setTaRowErrors] = useState({})
  const [taExporting, setTaExporting] = useState(false)
  const [taEditMode, setTaEditMode] = useState(false)
  const [actionToast, setActionToast] = useState(null)
  const isMountedRef = useRef(true)
  const fileInputRef = useRef(null)

  const isAdmin = role === 'Admin'

  const applyRowValidation = (row) => {
    const message = validatePercentageRow(row)
    setRowErrors((prev) => {
      if (message) {
        return { ...prev, [row._id]: message }
      }
      if (!prev[row._id]) {
        return prev
      }
      const next = { ...prev }
      delete next[row._id]
      return next
    })
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const showTransientMessage = (setter, message, duration = 4000) => {
    setter(message)
    window.setTimeout(() => setter(null), duration)
  }

  const loadRows = useCallback(async () => {
    if (!isMountedRef.current) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      const response = await NewJoineePayrollAPI.fetchList(token, params)
      if (!isMountedRef.current) {
        return
      }
      setRows((response.data ?? []).map((item) => normalizeRow(item)))
      setRowErrors({})
    } catch (err) {
      if (!isMountedRef.current) {
        return
      }
      console.error('Failed to load new joinee payroll entries', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to load new joinee sheet.'
      setError(message)
      setRows([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [activeDepartment, isAdmin, token])

  const parseCTCRange = (ctcRangeString) => {
    if (!ctcRangeString || typeof ctcRangeString !== 'string') {
      return { min: null, max: null }
    }
    const numbers = ctcRangeString.match(/\d+(?:\.\d+)?/g)
    if (!numbers || numbers.length === 0) {
      return { min: null, max: null }
    }
    const numericValues = numbers
      .map((n) => parseFloat(n))
      .filter((n) => !Number.isNaN(n))
    if (numericValues.length === 0) {
      return { min: null, max: null }
    }
    return {
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
    }
  }

  const loadTaRequirements = useCallback(async () => {
    if (!isMountedRef.current || !token) {
      return
    }
    setTaLoading(true)
    setTaError(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      const response = await TARequirementAPI.fetchList(token, params)
      if (!isMountedRef.current) {
        return
      }
      // Parse existing ctcRange values if minCTC/maxCTC are missing
      const rows = (response.data ?? []).map((row) => {
        if ((!row.minCTC && row.minCTC !== 0) || (!row.maxCTC && row.maxCTC !== 0)) {
          if (row.ctcRange) {
            const parsed = parseCTCRange(row.ctcRange)
            return {
              ...row,
              minCTC: parsed.min ?? 0,
              maxCTC: parsed.max ?? 0,
            }
          }
        }
        return row
      })
      setTaRows(rows)
    } catch (err) {
      if (!isMountedRef.current) {
        return
      }
      console.error('Failed to load TA requirements', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to load TA requirements.'
      setTaError(message)
      setTaRows([])
    } finally {
      if (isMountedRef.current) {
        setTaLoading(false)
      }
    }
  }, [activeDepartment, isAdmin, token])

  useEffect(() => {
    if (!token) {
      return
    }
    loadRows()
    loadTaRequirements()
  }, [loadRows, loadTaRequirements, token])

  const handleDepartmentChange = (value) => {
    setActiveDepartment(value)
  }

  const handleFieldChange = (rowId, field, value) => {
    let updatedRow = null
    setRows((prev) =>
      prev.map((row) => {
        if (row._id !== rowId) return row

        let nextRow = {
          ...row,
          [field]: value,
        }

        // When asset requirement is not selected or NA, auto-set device fields (including peripherals) to NA
        if (field === 'assetRequirement' && (!value || value === 'NA')) {
          const DEVICE_FIELDS = [
            'processor',
            'operatingSystem',
            'storage',
            'ram',
            'displaySize',
            'graphicCard',
            'peripherals',
            'headPhone',
            'mobilePhone',
            'scienceSbu',
          ]
          DEVICE_FIELDS.forEach((key) => {
            nextRow[key] = 'NA'
          })
        }

        updatedRow = nextRow
        return nextRow
      })
    )
    if (updatedRow) {
      applyRowValidation(updatedRow)
    }
  }

  const buildPayload = (row) => {
    const payload = {}

    COLUMN_DEFINITIONS.forEach(({ key }) => {
      if (row[key] !== undefined && row[key] !== null) {
        if (key === 'doj' && row[key] === '') {
          return
        }
        payload[key] = row[key]
      }
    })

    if (isAdmin) {
      if (row.departmentId) {
        payload.departmentId = row.departmentId
      }
      if (row.departmentKey || activeDepartment !== 'all') {
        payload.departmentKey = row.departmentKey || activeDepartment
      }
      if (row.departmentLabel) {
        payload.departmentLabel = row.departmentLabel
      }
    }

    return payload
  }

  const handleSaveRow = async (row) => {
    if (!row.employeeName?.trim()) {
      setError('Employee name is required before saving.')
      return
    }

    const validationMessage = validatePercentageRow(row)
    if (validationMessage) {
      applyRowValidation(row)
      setError(validationMessage)
      return
    }

    setSavingId(row._id)
    setError(null)
    try {
      const payload = buildPayload(row)
      const response = row._id.startsWith('temp-')
        ? await NewJoineePayrollAPI.create(token, payload)
        : await NewJoineePayrollAPI.update(token, row._id, payload)

      setRows((prev) =>
        prev.map((existing) =>
          existing._id === row._id ? normalizeRow(response.data) : existing
        )
      )
      setRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      showTransientMessage(setSuccessMessage, 'Sheet updated successfully.')
      showTransientMessage(
        setActionToast,
        row._id.startsWith('temp-')
          ? 'Row added successfully.'
          : 'Row updated successfully.'
      )
      await loadTaRequirements()
      showTransientMessage(setActionToast, 'Row deleted successfully.')
    } catch (err) {
      console.error('Failed to save entry', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to save the selected row.'
      setError(message)
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteRow = async (row) => {
    if (!row?._id || row._id.startsWith('temp-')) {
      setRows((prev) => prev.filter((item) => item._id !== row._id))
      setRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      return
    }

    try {
      await NewJoineePayrollAPI.remove(token, row._id)
      setRows((prev) => prev.filter((item) => item._id !== row._id))
      setRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      await loadTaRequirements()
      showTransientMessage(setActionToast, 'Row deleted successfully.')
    } catch (err) {
      console.error('Failed to delete entry', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to delete the selected row.'
      setError(message)
    }
  }

  const handleAddRow = () => {
    console.log('Add Row button clicked')
    // Automatically enable edit mode when adding a row (if user has permission)
    if ((role === 'Admin' || role === 'HOD') && !editMode) {
      setEditMode(true)
    }
    const departmentKey =
      isAdmin && activeDepartment !== 'all' ? activeDepartment : ''
    const newRow = createEmptyRow(role, departmentKey)
    if (departmentKey && !newRow.departmentLabel) {
      newRow.departmentLabel =
        departmentKey.charAt(0).toUpperCase() + departmentKey.slice(1)
    }
    console.log('Adding new row:', newRow)
    setRows((prev) => {
      const updated = [newRow, ...prev]
      console.log('Updated rows count:', updated.length)
      return updated
    })
  }

  const handleGenerateSheet = async () => {
    if (!token || exporting) {
      return
    }
    setExporting(true)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      await NewJoineePayrollAPI.exportSheet(token, params)
    } catch (err) {
      console.error('Failed to export new joinee sheet', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to generate the new joinee sheet.'
      setError(message)
    } finally {
      setExporting(false)
    }
  }

  const handleUploadSheet = async (file) => {
    if (!token || uploading || !file) {
      return
    }
    setUploading(true)
    setError(null)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      await NewJoineePayrollAPI.uploadSheet(token, file, params)
      await loadRows()
      await loadTaRequirements()
    } catch (err) {
      console.error('Failed to upload new joinee sheet', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to upload the new joinee sheet.'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadButton = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleUploadChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    await handleUploadSheet(file)
    event.target.value = ''
  }

  const handleTaFieldChange = (rowId, field, value) => {
    setTaRows((prev) =>
      prev.map((row) => {
        if (row._id !== rowId) return row
        return {
          ...row,
          [field]: value,
        }
      })
    )
  }

  const handleTaSaveRow = async (row) => {
    if (!row.roleName?.trim()) {
      setTaError('Role name is required before saving.')
      return
    }

    setTaSavingId(row._id)
    setTaError(null)
    try {
      const payload = { ...row }
      // Remove _id and other non-editable fields if needed
      delete payload._id
      delete payload.roleNameNormalized
      delete payload.createdAt
      delete payload.updatedAt
      delete payload.createdBy
      delete payload.updatedBy

      const response = row._id.startsWith('temp-')
        ? await TARequirementAPI.create(token, payload)
        : await TARequirementAPI.update(token, row._id, payload)

      setTaRows((prev) =>
        prev.map((existing) =>
          existing._id === row._id ? response.data : existing
        )
      )
      setTaRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      showTransientMessage(setTaSuccessMessage, 'TA sheet updated successfully.')
      showTransientMessage(
        setActionToast,
        row._id.startsWith('temp-')
          ? 'TA requirement added successfully.'
          : 'TA requirement updated successfully.'
      )
    } catch (err) {
      console.error('Failed to save TA requirement entry', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to save the selected TA requirement row.'
      setTaError(message)
    } finally {
      setTaSavingId(null)
    }
  }

  const handleTaDeleteRow = async (row) => {
    if (!row?._id || row._id.startsWith('temp-')) {
      setTaRows((prev) => prev.filter((item) => item._id !== row._id))
      setTaRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      showTransientMessage(setActionToast, 'TA requirement deleted successfully.')
      return
    }

    try {
      await TARequirementAPI.remove(token, row._id)
      setTaRows((prev) => prev.filter((item) => item._id !== row._id))
      setTaRowErrors((prev) => {
        if (!prev[row._id]) return prev
        const next = { ...prev }
        delete next[row._id]
        return next
      })
      showTransientMessage(setActionToast, 'TA requirement deleted successfully.')
    } catch (err) {
      console.error('Failed to delete TA requirement entry', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to delete the selected TA requirement row.'
      setTaError(message)
    }
  }

  const handleTaGenerateSheet = async () => {
    if (!token || taExporting) {
      return
    }
    setTaExporting(true)
    try {
      const params =
        isAdmin && activeDepartment !== 'all'
          ? { department: activeDepartment }
          : undefined
      await TARequirementAPI.exportSheet(token, params)
    } catch (err) {
      console.error('Failed to export TA requirements sheet', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to generate the TA requirements sheet.'
      setTaError(message)
    } finally {
      setTaExporting(false)
    }
  }

  const isSalesListingMode =
    isAdmin && (mode === 'source' || mode === 'beneficiary')

  const salesScopedRows = useMemo(() => {
    if (!isAdmin || !isSalesListingMode) {
      return rows
    }
    if (mode === 'source') {
      return rows.filter(
        (row) => 
          // Always show temporary (new) rows
          row._id?.startsWith('temp-') ||
          normalizeDepartment(row.sourceDepartment) === SALES_KEY
      )
    }
    if (mode === 'beneficiary') {
      return rows.filter(
        (row) => 
          // Always show temporary (new) rows
          row._id?.startsWith('temp-') ||
          normalizeDepartment(row.beneficiaryDepartment) === SALES_KEY
      )
    }
    return rows
  }, [isAdmin, isSalesListingMode, mode, rows])

  const hasTempRow = rows.some((row) => row._id?.startsWith('temp-'))
  const salesFilterActive =
    isAdmin && isSalesListingMode && salesScopedRows.length > 0 && !hasTempRow
  const visibleRows = salesFilterActive ? salesScopedRows : rows

  const searchableRows = useMemo(() => {
    if (!search.trim()) {
      return visibleRows
    }
    const query = search.trim().toLowerCase()
    return visibleRows.filter((row) => buildSearchableText(row).includes(query))
  }, [search, visibleRows])

  const taScopedRows = useMemo(() => {
    if (!isAdmin || !isSalesListingMode) {
      return taRows
    }
    if (mode === 'source') {
      return taRows.filter((row) =>
        (row.sourceDepartmentKeys ?? []).includes(SALES_KEY)
      )
    }
    return taRows.filter((row) =>
      (row.beneficiaryDepartmentKeys ?? []).includes(SALES_KEY)
    )
  }, [isAdmin, isSalesListingMode, mode, taRows])

  const taSalesFilterActive =
    isAdmin && isSalesListingMode && taScopedRows.length > 0
  const visibleTaRows =
    isAdmin && (taSalesFilterActive || !isSalesListingMode)
      ? taScopedRows
      : taRows

  const sheetDescription = useMemo(() => {
    if (isAdmin) {
      const baseDescription =
        activeDepartment === 'all'
        ? 'Viewing all departments.'
        : `Filtering new joinees for ${activeDepartment.toUpperCase()}.`
      if (salesFilterActive) {
        const listingLabel =
          mode === 'source' ? 'Source: Sales listing' : 'Beneficiary: Sales listing'
        return `${baseDescription} Showing ${listingLabel}.`
      }
      return baseDescription
    }
    const baseScoped = 'HOD view always scopes to your department.'
    if (isAdmin && salesFilterActive) {
      const listingLabel =
        mode === 'source' ? 'Source: Sales listing' : 'Beneficiary: Sales listing'
      return `${baseScoped} Showing ${listingLabel}.`
    }
    return baseScoped
  }, [activeDepartment, isAdmin, mode, salesFilterActive])

  return (
    <section className="space-y-6">
      <NewJoineeToolbar
        role={role}
        activeDepartment={activeDepartment}
        onDepartmentChange={handleDepartmentChange}
        onAddRow={handleAddRow}
        onGenerateSheet={handleGenerateSheet}
        onUploadSheet={handleUploadButton}
        exporting={exporting}
        uploading={uploading}
        loading={loading}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleUploadChange}
      />

      <div className="flex items-center justify-between rounded-3xl border border-slate-900/60 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        <p>{sheetDescription}</p>
        <div className="flex items-center gap-3">
          {(role === 'Admin' || role === 'HOD') && (
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
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

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-900/70 bg-slate-950/60 px-4 py-4 text-sm text-slate-300">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.4em] text-slate-500" htmlFor="new-joinee-search">
            Search
          </label>
          <input
            id="new-joinee-search"
            type="search"
            placeholder="Search by name, department or HOD"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      <NewJoineeTable
        columns={COLUMN_DEFINITIONS}
        rows={searchableRows}
        loading={loading}
        role={role}
        isEditMode={editMode}
        savingId={savingId}
        rowErrors={rowErrors}
        onFieldChange={handleFieldChange}
        onSaveRow={handleSaveRow}
        onDeleteRow={handleDeleteRow}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-1 rounded-3xl border border-slate-900/60 bg-slate-950/60 px-4 py-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.4em] text-slate-300">
              TA Requirements
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Aggregated automatically from New Joinee entries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(role === 'Admin' || role === 'HOD') && (
              <button
                type="button"
                onClick={() => setTaEditMode(!taEditMode)}
                className="inline-flex items-center justify-center rounded-2xl border border-blue-400/50 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/20 hover:text-blue-100"
              >
                {taEditMode ? 'View Mode' : 'Edit'}
              </button>
            )}
            <button
              type="button"
              onClick={handleTaGenerateSheet}
              disabled={taLoading || taExporting}
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {taExporting ? 'Generating…' : 'Generate Sheet'}
            </button>
            <button
              type="button"
              onClick={loadTaRequirements}
              className="text-xs uppercase tracking-[0.4em] text-emerald-300 underline decoration-dotted underline-offset-4"
            >
              Refresh
            </button>
          </div>
        </div>

        {taError ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {taError}
          </div>
        ) : null}
        {taSuccessMessage ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {taSuccessMessage}
          </div>
        ) : null}

        <TARequirementsTable
          columns={TA_COLUMN_DEFINITIONS}
          rows={visibleTaRows}
          loading={taLoading}
          role={role}
          isEditMode={taEditMode}
          savingId={taSavingId}
          rowErrors={taRowErrors}
          onFieldChange={handleTaFieldChange}
          onSaveRow={handleTaSaveRow}
          onDeleteRow={handleTaDeleteRow}
        />
      </section>
      {actionToast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-400/40 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-xl backdrop-blur">
          {actionToast}
        </div>
      ) : null}
    </section>
  )
}


