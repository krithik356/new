import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError } from '../../services/apiClient.js'
import { useAuth } from '../../providers/AuthProvider.jsx'
import { ExistingEmployeePayrollAPI } from '../../api/existingEmployeePayroll.js'
import ExistingEmployeeToolbar from '../../components/payroll/existing-employees/ExistingEmployeeToolbar.jsx'
import ExistingEmployeeTable from '../../components/payroll/existing-employees/ExistingEmployeeTable.jsx'

const COLUMN_DEFINITIONS = [
  { key: 'empId', label: 'EMP ID', width: '140px' },
  { key: 'empName', label: 'EMP Name', width: '200px' },
  { key: 'doj', label: 'DOJ', width: '140px' },
  { key: 'doe', label: 'DOE', width: '140px' },
  { key: 'month', label: 'Month', width: '140px' },
  { key: 'designation', label: 'Designation', width: '180px' },
  { key: 'departmentLabel', label: 'Department', width: '180px' },
  { key: 'topDepartment', label: 'Top Department', width: '180px' },
  { key: 'type', label: 'Type', width: '140px' },
  { key: 'sourceDepartment', label: 'Source Department', width: '200px' },
  { key: 'beneficiaryDepartment', label: 'Benficiary Department', width: '220px' },
  { key: 'sourceHod', label: 'Source HOD', width: '180px' },
  { key: 'beneficiaryHod', label: 'Benficiary HOD', width: '200px' },
  { key: 'workMode', label: 'WFO/WFH', width: '140px' },
  { key: 'employeeType', label: 'Employee Type', width: '180px' },
  { key: 'academy', label: 'Academy', width: '140px' },
  { key: 'intensive', label: 'Intensive', width: '140px' },
  { key: 'niatBatch12', label: 'NIAT Batch 1&2', width: '180px' },
  { key: 'niatBatch3', label: 'NIAT Batch 3', width: '160px' },
  { key: 'niatBatch4', label: 'NIAT Batch 4', width: '160px' },
  { key: 'others', label: 'Others', width: '150px' },
  { key: 'common', label: 'Common', width: '150px' },
]

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
    if (key === 'doj' || key === 'doe') {
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

export default function ExistingEmployeesSheet() {
  const { token, user } = useAuth()
  const role = user?.role ?? 'Member'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [activeDepartment, setActiveDepartment] = useState(
    role === 'Admin' ? 'all' : 'hod'
  )
  const isMountedRef = useRef(true)

  const isAdmin = role === 'Admin'

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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
      const response = await ExistingEmployeePayrollAPI.fetchList(token, params)
      if (!isMountedRef.current) {
        return
      }
      setRows((response.data ?? []).map((item) => normalizeRow(item)))
    } catch (err) {
      if (!isMountedRef.current) {
        return
      }
      console.error('Failed to load existing employee payroll entries', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to load the existing employees sheet.'
      setError(message)
      setRows([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [activeDepartment, isAdmin, token])

  useEffect(() => {
    if (!token) {
      return
    }
    loadRows()
  }, [loadRows, token])

  const handleDepartmentChange = (value) => {
    setActiveDepartment(value)
  }

  const handleFieldChange = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row._id !== rowId) return row
        return {
          ...row,
          [field]: value,
        }
      })
    )
  }

  const buildPayload = (row) => {
    const payload = {}

    COLUMN_DEFINITIONS.forEach(({ key }) => {
      if (row[key] !== undefined && row[key] !== null) {
        if ((key === 'doj' || key === 'doe') && row[key] === '') {
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
    if (!row.empName?.trim()) {
      setError('Employee name is required before saving.')
      return
    }

    setSavingId(row._id)
    setError(null)
    try {
      const payload = buildPayload(row)
      const response = row._id.startsWith('temp-')
        ? await ExistingEmployeePayrollAPI.create(token, payload)
        : await ExistingEmployeePayrollAPI.update(token, row._id, payload)

      setRows((prev) =>
        prev.map((existing) =>
          existing._id === row._id ? normalizeRow(response.data) : existing
        )
      )
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
      return
    }

    try {
      await ExistingEmployeePayrollAPI.remove(token, row._id)
      setRows((prev) => prev.filter((item) => item._id !== row._id))
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
    const departmentKey =
      isAdmin && activeDepartment !== 'all' ? activeDepartment : ''
    const newRow = createEmptyRow(role, departmentKey)
    if (departmentKey && !newRow.departmentLabel) {
      newRow.departmentLabel =
        departmentKey.charAt(0).toUpperCase() + departmentKey.slice(1)
    }
    setRows((prev) => [newRow, ...prev])
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
      await ExistingEmployeePayrollAPI.exportSheet(token, params)
    } catch (err) {
      console.error('Failed to export existing employee sheet', err)
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message ?? 'Unable to generate the existing employee sheet.'
      setError(message)
    } finally {
      setExporting(false)
    }
  }

  const sheetDescription = useMemo(() => {
    if (isAdmin) {
      return activeDepartment === 'all'
        ? 'Viewing all departments.'
        : `Filtering existing employees for ${activeDepartment.toUpperCase()}.`
    }
    return 'HOD view always scopes to your department.'
  }, [activeDepartment, isAdmin])

  return (
    <section className="space-y-6">
      <ExistingEmployeeToolbar
        role={role}
        activeDepartment={activeDepartment}
        onDepartmentChange={handleDepartmentChange}
        onAddRow={handleAddRow}
        onGenerateSheet={handleGenerateSheet}
        exporting={exporting}
        loading={loading}
      />

      <div className="flex items-center justify-between rounded-3xl border border-slate-900/60 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
        <p>{sheetDescription}</p>
        <button
          type="button"
          onClick={loadRows}
          className="text-xs uppercase tracking-[0.4em] text-emerald-300 underline decoration-dotted underline-offset-4"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <ExistingEmployeeTable
        columns={COLUMN_DEFINITIONS}
        rows={rows}
        loading={loading}
        role={role}
        savingId={savingId}
        onFieldChange={handleFieldChange}
        onSaveRow={handleSaveRow}
        onDeleteRow={handleDeleteRow}
      />
    </section>
  )
}


