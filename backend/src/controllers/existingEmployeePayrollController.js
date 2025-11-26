const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const { ExistingEmployeePayroll } = require("../models/ExistingEmployeePayroll");
const { Department } = require("../models/Department");

const TEXT_FIELDS = [
  "empId",
  "empName",
  "designation",
  "topDepartment",
  "type",
  "sourceDepartment",
  "beneficiaryDepartment",
  "sourceHod",
  "beneficiaryHod",
  "wfoWfh",
  "employeeType",
];

const NUMERIC_FIELDS = [
  "salary",
  "academy",
  "intensive",
  "niatBatch1And2",
  "niatBatch3",
  "niatBatch4",
  "others",
  "common",
];

const DATE_FIELDS = ["doj", "doe"];

const EXPORT_HEADERS = [
  { key: "empId", header: "EMP ID", width: 14 },
  { key: "empName", header: "EMP Name", width: 24 },
  { key: "doj", header: "DOJ", width: 14 },
  { key: "doe", header: "DOE", width: 14 },
  { key: "month", header: "Month", width: 12 },
  { key: "designation", header: "Designation", width: 18 },
  { key: "department", header: "Department", width: 20 },
  { key: "topDepartment", header: "Top Department", width: 18 },
  { key: "type", header: "Type", width: 14 },
  { key: "sourceDepartment", header: "Source Department", width: 20 },
  { key: "beneficiaryDepartment", header: "Beneficiary Department", width: 22 },
  { key: "sourceHod", header: "Source HOD", width: 18 },
  { key: "beneficiaryHod", header: "Beneficiary HOD", width: 20 },
  { key: "salary", header: "Salary", width: 14 },
  { key: "wfoWfh", header: "WFO/WFH", width: 12 },
  { key: "employeeType", header: "Employee Type", width: 16 },
  { key: "academy", header: "Academy", width: 12 },
  { key: "intensive", header: "Intensive", width: 12 },
  { key: "niatBatch1And2", header: "NIAT Batch 1 & 2", width: 16 },
  { key: "niatBatch3", header: "NIAT Batch 3", width: 14 },
  { key: "niatBatch4", header: "NIAT Batch 4", width: 14 },
  { key: "others", header: "Others", width: 12 },
  { key: "common", header: "Common", width: 12 },
];

function normalizeDateInput(value, { monthOnly = false } = {}) {
  if (value === undefined) {
    return { shouldSet: false };
  }

  if (value === null || value === "") {
    return {
      shouldSet: true,
      value: null,
    };
  }

  if (monthOnly && typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map((segment) => Number(segment));
    if (Number.isNaN(year) || Number.isNaN(month)) {
      return {
        shouldSet: true,
        error: "Month must be a valid YYYY-MM value.",
      };
    }
    const date = new Date(Date.UTC(year, month - 1, 1));
    return {
      shouldSet: true,
      value: date,
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      shouldSet: true,
      error: "Date must be valid.",
    };
  }

  if (monthOnly) {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  }

  return { shouldSet: true, value: date };
}

function coerceNumber(value, fieldLabel) {
  if (value === undefined) {
    return { shouldSet: false };
  }

  if (value === null || value === "") {
    return { shouldSet: true, value: null };
  }

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return {
      shouldSet: true,
      error: `${fieldLabel} must be a number.`,
    };
  }

  return { shouldSet: true, value: numberValue };
}

function extractPayload(body) {
  const data = {};
  const errors = [];

  TEXT_FIELDS.forEach((field) => {
    if (body[field] === undefined) {
      return;
    }
    const raw = body[field];
    if (raw === null) {
      data[field] = null;
      return;
    }
    const trimmed = String(raw).trim();
    data[field] = trimmed.length === 0 ? null : trimmed;
  });

  NUMERIC_FIELDS.forEach((field) => {
    const result = coerceNumber(body[field], field);
    if (!result.shouldSet) {
      return;
    }
    if (result.error) {
      errors.push({ field, message: result.error });
      return;
    }
    data[field] = result.value;
  });

  DATE_FIELDS.forEach((field) => {
    const result = normalizeDateInput(body[field]);
    if (!result.shouldSet) {
      return;
    }
    if (result.error) {
      errors.push({ field, message: `${field.toUpperCase()} ${result.error}` });
      return;
    }
    data[field] = result.value;
  });

  const monthResult = normalizeDateInput(body.month, { monthOnly: true });
  if (monthResult.shouldSet) {
    if (monthResult.error) {
      errors.push({ field: "month", message: monthResult.error });
    } else {
      data.month = monthResult.value;
    }
  }

  if (body.department !== undefined) {
    data.department =
      body.department === null || body.department === ""
        ? null
        : String(body.department);
  }

  return { data, errors };
}

function validatePayload(
  payload,
  { isCreate = false, requireDepartment = false } = {}
) {
  const errors = [];

  if ((isCreate || payload.empId !== undefined) && !payload.empId) {
    errors.push({ field: "empId", message: "EMP ID is required." });
  }

  if ((isCreate || payload.empName !== undefined) && !payload.empName) {
    errors.push({ field: "empName", message: "EMP Name is required." });
  }

  if ((isCreate || payload.doj !== undefined) && !payload.doj) {
    errors.push({ field: "doj", message: "DOJ is required." });
  }

  if ((isCreate || payload.month !== undefined) && !payload.month) {
    errors.push({ field: "month", message: "Month is required." });
  }

  if ((isCreate || payload.salary !== undefined) && payload.salary == null) {
    errors.push({ field: "salary", message: "Salary must be provided." });
  }

  if (payload.salary != null && Number(payload.salary) < 0) {
    errors.push({ field: "salary", message: "Salary must be non-negative." });
  }

  if (
    (requireDepartment || payload.department !== undefined) &&
    !payload.department
  ) {
    errors.push({
      field: "department",
      message: "Department is required.",
    });
  } else if (payload.department) {
    if (!mongoose.isValidObjectId(payload.department)) {
      errors.push({
        field: "department",
        message: "Department must be a valid id.",
      });
    }
  }

  return errors;
}

function serializePayroll(doc) {
  if (!doc) {
    return null;
  }
  const department =
    typeof doc.department === "object" && doc.department !== null
      ? doc.department
      : null;

  return {
    id: doc._id?.toString(),
    empId: doc.empId ?? null,
    empName: doc.empName ?? null,
    doj: doc.doj ? doc.doj.toISOString() : null,
    doe: doc.doe ? doc.doe.toISOString() : null,
    month: doc.month ? doc.month.toISOString() : null,
    designation: doc.designation ?? null,
    department: department
      ? {
          id: department._id?.toString(),
          name: department.name ?? null,
          code: department.code ?? null,
        }
      : null,
    departmentId: department
      ? department._id?.toString()
      : doc.department?.toString() ?? null,
    topDepartment: doc.topDepartment ?? null,
    type: doc.type ?? null,
    sourceDepartment: doc.sourceDepartment ?? null,
    beneficiaryDepartment: doc.beneficiaryDepartment ?? null,
    sourceHod: doc.sourceHod ?? null,
    beneficiaryHod: doc.beneficiaryHod ?? null,
    salary: doc.salary ?? null,
    wfoWfh: doc.wfoWfh ?? null,
    employeeType: doc.employeeType ?? null,
    academy: doc.academy ?? null,
    intensive: doc.intensive ?? null,
    niatBatch1And2: doc.niatBatch1And2 ?? null,
    niatBatch3: doc.niatBatch3 ?? null,
    niatBatch4: doc.niatBatch4 ?? null,
    others: doc.others ?? null,
    common: doc.common ?? null,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

async function ensureDepartmentExists(departmentId) {
  if (!departmentId) {
    return null;
  }
  const department = await Department.findById(departmentId)
    .select("name code")
    .lean();
  return department;
}

async function buildRoleAwareFilter(req, queryDepartmentId) {
  const filter = {};
  if (req.user.role === "HOD") {
    if (!req.user.department) {
      throw Object.assign(new Error("Department is required for HOD users."), {
        statusCode: 400,
      });
    }
    filter.department = req.user.department;
  } else if (queryDepartmentId) {
    if (!mongoose.isValidObjectId(queryDepartmentId)) {
      throw Object.assign(new Error("Invalid department id."), {
        statusCode: 400,
      });
    }
    filter.department = queryDepartmentId;
  }

  return filter;
}

async function listExistingEmployeePayrolls(req, res, next) {
  try {
    const filter = await buildRoleAwareFilter(req, req.query.department);

    const rows = await ExistingEmployeePayroll.find(filter)
      .populate("department", "name code")
      .sort({ empName: 1 })
      .lean();

    return res.json({
      success: true,
      data: rows.map(serializePayroll),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    return next(error);
  }
}

async function createExistingEmployeePayroll(req, res, next) {
  try {
    const { data, errors: parseErrors } = extractPayload(req.body || {});

    if (req.user.role === "HOD") {
      if (!req.user.department) {
        return res.status(400).json({
          success: false,
          message:
            "You must be assigned to a department before creating payroll rows.",
        });
      }
      data.department = req.user.department;
    }

    const validationErrors = validatePayload(data, {
      isCreate: true,
      requireDepartment: req.user.role === "Admin",
    });

    const errors = [...parseErrors, ...validationErrors];

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to create payroll row.",
        errors,
      });
    }

    const department = await ensureDepartmentExists(data.department);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department could not be found.",
      });
    }

    const created = await ExistingEmployeePayroll.create(data);
    const populated = await created.populate("department", "name code");

    return res.status(201).json({
      success: true,
      data: serializePayroll(populated),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateExistingEmployeePayroll(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll row id.",
      });
    }

    const existing = await ExistingEmployeePayroll.findById(id).populate(
      "department",
      "name code"
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Payroll row not found.",
      });
    }

    if (req.user.role === "HOD") {
      if (!req.user.department) {
        return res.status(403).json({
          success: false,
          message:
            "You must be assigned to a department to update payroll rows.",
        });
      }
      if (
        String(existing.department?._id || existing.department) !==
        String(req.user.department)
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this payroll row.",
        });
      }
    }

    const { data, errors: parseErrors } = extractPayload(req.body || {});

    if (req.user.role !== "Admin") {
      delete data.department;
    }

    const validationErrors = validatePayload(data, {
      isCreate: false,
      requireDepartment: false,
    });

    const errors = [...parseErrors, ...validationErrors];

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to update payroll row.",
        errors,
      });
    }

    if (data.department) {
      const department = await ensureDepartmentExists(data.department);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department could not be found.",
        });
      }
    }

    Object.entries(data).forEach(([key, value]) => {
      existing[key] = value;
    });

    await existing.save();
    const populated = await existing.populate("department", "name code");

    return res.json({
      success: true,
      data: serializePayroll(populated),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteExistingEmployeePayroll(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll row id.",
      });
    }

    const deleted = await ExistingEmployeePayroll.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Payroll row not found.",
      });
    }

    return res.json({
      success: true,
      message: "Payroll row deleted.",
    });
  } catch (error) {
    return next(error);
  }
}

function formatDateForExport(date) {
  if (!date) {
    return "";
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString().split("T")[0];
}

function formatMonthForExport(date) {
  if (!date) {
    return "";
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString().slice(0, 7);
}

async function exportExistingEmployeePayrollSheet(req, res, next) {
  try {
    const filter = await buildRoleAwareFilter(req, req.query.department);

    const rows = await ExistingEmployeePayroll.find(filter)
      .populate("department", "name code")
      .sort({ empName: 1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Existing Employees", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = EXPORT_HEADERS;

    rows.forEach((row) => {
      sheet.addRow({
        empId: row.empId ?? "",
        empName: row.empName ?? "",
        doj: formatDateForExport(row.doj),
        doe: formatDateForExport(row.doe),
        month: formatMonthForExport(row.month),
        designation: row.designation ?? "",
        department: row.department?.name ?? "",
        topDepartment: row.topDepartment ?? "",
        type: row.type ?? "",
        sourceDepartment: row.sourceDepartment ?? "",
        beneficiaryDepartment: row.beneficiaryDepartment ?? "",
        sourceHod: row.sourceHod ?? "",
        beneficiaryHod: row.beneficiaryHod ?? "",
        salary: row.salary ?? "",
        wfoWfh: row.wfoWfh ?? "",
        employeeType: row.employeeType ?? "",
        academy: row.academy ?? "",
        intensive: row.intensive ?? "",
        niatBatch1And2: row.niatBatch1And2 ?? "",
        niatBatch3: row.niatBatch3 ?? "",
        niatBatch4: row.niatBatch4 ?? "",
        others: row.others ?? "",
        common: row.common ?? "",
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="existing_employee_payroll.xlsx"'
    );

    return res.send(buffer);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    return next(error);
  }
}

module.exports = {
  listExistingEmployeePayrolls,
  createExistingEmployeePayroll,
  updateExistingEmployeePayroll,
  deleteExistingEmployeePayroll,
  exportExistingEmployeePayrollSheet,
};


