const ExcelJS = require("exceljs");
const { parse } = require("csv-parse/sync");
const { NonPayrollItem } = require("../models/NonPayrollItem");
const { Department } = require("../models/Department");

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COLUMN_DEFINITIONS = [
  { key: "uniqueId", header: "Unique ID", required: true },
  { key: "responsibleDepartment", header: "Responsible Department", required: true },
  { key: "beneficiaryDepartment", header: "Beneficiary Department", required: true },
  { key: "responsibleDepartmentHod", header: "Responsible Department HOD", required: true },
  { key: "beneficiaryDepartmentHod", header: "Beneficiary Department HOD", required: true },
  { key: "type", header: "Type", required: true },
  { key: "vendor", header: "Vendor", required: true },
  { key: "description", header: "Description", required: true },
  { key: "category", header: "Category", required: true },
  { key: "product", header: "Product", required: true },
  { key: "serviceStartDate", header: "Service Start Date" },
  { key: "serviceEndDate", header: "Service End Date" },
  { key: "serviceDurationDays", header: "Service Duration" },
  {
    key: "budgetedPaymentAmountExcGst",
    header: "Budgeted Payment Amount (Exc GST)",
    required: true,
    numeric: true,
  },
  {
    key: "gstAmount",
    header: "GST Amount",
    required: true,
    numeric: true,
  },
  {
    key: "budgetedPaymentAmountInclGst",
    header: "Budgeted Payment Amount (Incl GST)",
    numeric: true,
  },
  { key: "dueMonthForPayment", header: "Due Month for Payment" },
];

const HEADER_ORDER = COLUMN_DEFINITIONS.map((column) => column.header);
const HEADER_TO_KEY = new Map(
  COLUMN_DEFINITIONS.map((column) => [column.header, column.key])
);
const KEY_TO_HEADER = new Map(
  COLUMN_DEFINITIONS.map((column) => [column.key, column.header])
);
const NUMERIC_KEYS = [
  "budgetedPaymentAmountExcGst",
  "gstAmount",
  "budgetedPaymentAmountInclGst",
];
const DATE_KEYS = ["serviceStartDate", "serviceEndDate"];

const REQUIRED_FIELDS = COLUMN_DEFINITIONS.filter(
  (column) => column.required
).map((column) => column.key);

const REQUIRED_UPLOAD_MESSAGE = (row, header) =>
  `Row ${row}: ${header} is required.`;
const NUMERIC_UPLOAD_MESSAGE = (row, header) =>
  `Row ${row}: ${header} must be a valid number.`;
const DATE_ORDER_MESSAGE = (row) =>
  `Row ${row}: Service End Date must be greater than or equal to Service Start Date.`;
const DUPLICATE_MESSAGE = (row, value) =>
  `Row ${row}: Unique ID ${value} is duplicated.`;

function formatDateForExport(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function parseDateInput(value) {
  if (value === undefined || value === null || value === "") {
    return { date: null };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { error: "Invalid date." };
    }
    return { date: value };
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (Number.isNaN(date.getTime())) {
      return { error: "Invalid date." };
    }
    return { date };
  }

  const trimmed = value.toString().trim();
  if (!trimmed) {
    return { date: null };
  }

  const isoCandidate = new Date(trimmed);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return { date: isoCandidate };
  }

  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    if (
      Number.isInteger(day) &&
      Number.isInteger(month) &&
      Number.isInteger(year)
    ) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(date.getTime())) {
        return { date };
      }
    }
  }

  return { error: "Invalid date." };
}

function calculateServiceDurationDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return null;
  }
  const ms = endDate.getTime() - startDate.getTime();
  const days = Math.floor(ms / 86400000);
  return days >= 0 ? days : null;
}

function calculateBudgetedInclGst(exc, gst) {
  if (exc === null || exc === undefined) {
    return null;
  }
  const gstValue = gst === null || gst === undefined ? 0 : gst;
  return Number((exc + gstValue).toFixed(2));
}

function normalizeMonth(value) {
  if (!value) {
    return null;
  }
  const normalized = value.toString().trim().toLowerCase();
  const found = MONTH_OPTIONS.find(
    (month) => month.toLowerCase() === normalized
  );
  return found || null;
}

function sanitizeString(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return value.toString().trim();
}

async function resolveHodDepartmentName(user) {
  if (user.role !== "HOD") {
    return null;
  }
  if (!user.department) {
    const error = new Error(
      "You must be assigned to a department to manage non-payroll items."
    );
    error.statusCode = 400;
    throw error;
  }
  const department = await Department.findById(user.department)
    .select("name")
    .lean();
  if (!department || !department.name) {
    const error = new Error(
      "Your assigned department could not be found. Please contact an administrator."
    );
    error.statusCode = 404;
    throw error;
  }
  return department.name;
}

function serializeItem(document) {
  if (!document) {
    return null;
  }
  return {
    id: document._id?.toString(),
    uniqueId: document.uniqueId,
    responsibleDepartment: document.responsibleDepartment,
    beneficiaryDepartment: document.beneficiaryDepartment,
    responsibleDepartmentHod: document.responsibleDepartmentHod,
    beneficiaryDepartmentHod: document.beneficiaryDepartmentHod,
    type: document.type,
    vendor: document.vendor,
    description: document.description,
    category: document.category,
    product: document.product,
    serviceStartDate: document.serviceStartDate
      ? document.serviceStartDate.toISOString()
      : null,
    serviceEndDate: document.serviceEndDate
      ? document.serviceEndDate.toISOString()
      : null,
    serviceDurationDays: document.serviceDurationDays,
    budgetedPaymentAmountExcGst: document.budgetedPaymentAmountExcGst,
    gstAmount: document.gstAmount,
    budgetedPaymentAmountInclGst: document.budgetedPaymentAmountInclGst,
    dueMonthForPayment: document.dueMonthForPayment,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function applyCalculatedFields(payload, existing = {}) {
  const startDate =
    payload.serviceStartDate !== undefined
      ? payload.serviceStartDate
      : existing.serviceStartDate ?? null;
  const endDate =
    payload.serviceEndDate !== undefined
      ? payload.serviceEndDate
      : existing.serviceEndDate ?? null;
  const exc =
    payload.budgetedPaymentAmountExcGst !== undefined
      ? payload.budgetedPaymentAmountExcGst
      : existing.budgetedPaymentAmountExcGst ?? null;
  const gst =
    payload.gstAmount !== undefined
      ? payload.gstAmount
      : existing.gstAmount ?? null;

  payload.serviceDurationDays = calculateServiceDurationDays(startDate, endDate);
  payload.budgetedPaymentAmountInclGst = exc !== null ? calculateBudgetedInclGst(exc, gst) : null;

  if (startDate === null && payload.serviceStartDate !== undefined) {
    payload.serviceStartDate = null;
  }
  if (endDate === null && payload.serviceEndDate !== undefined) {
    payload.serviceEndDate = null;
  }
}

function buildValidationError(field, message) {
  return {
    field,
    message,
  };
}

function parseNumberInput(value) {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  const normalized =
    typeof value === "number"
      ? value
      : Number(
          value
            .toString()
            .replace(/,/g, "")
            .trim()
        );

  if (Number.isNaN(normalized) || normalized < 0) {
    return { error: "must be a valid number." };
  }
  return { value: Number(normalized.toFixed(2)) };
}

function buildPayloadFromBody(body, { partial = false } = {}) {
  const errors = [];
  const payload = {};

  COLUMN_DEFINITIONS.forEach((column) => {
    if (column.key === "serviceDurationDays" || column.key === "budgetedPaymentAmountInclGst") {
      return;
    }

    const rawValue = body[column.key];

    if (column.numeric) {
      if (rawValue === undefined) {
        if (!partial && column.required) {
          errors.push(
            buildValidationError(
              column.key,
              `${column.header} is required.`
            )
          );
        }
        return;
      }
      if (rawValue === null || rawValue === "") {
        if (column.required) {
          errors.push(
            buildValidationError(
              column.key,
              `${column.header} is required.`
            )
          );
        }
        return;
      }
      const { value, error } = parseNumberInput(rawValue);
      if (error) {
        errors.push(
          buildValidationError(
            column.key,
            `${column.header} ${error}`
          )
        );
        return;
      }
      payload[column.key] = value;
      return;
    }

    if (DATE_KEYS.includes(column.key)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        if (!partial) {
          payload[column.key] = null;
        }
        return;
      }
      const { date, error } = parseDateInput(rawValue);
      if (error) {
        errors.push(buildValidationError(column.key, error));
        return;
      }
      payload[column.key] = date;
      return;
    }

    if (column.key === "dueMonthForPayment") {
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        payload[column.key] = null;
        return;
      }
      const month = normalizeMonth(rawValue);
      payload[column.key] = month;
      return;
    }

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (!partial && column.required) {
        errors.push(
          buildValidationError(column.key, `${column.header} is required.`)
        );
      }
      return;
    }

    payload[column.key] = sanitizeString(rawValue);
  });

  if (
    payload.serviceStartDate &&
    payload.serviceEndDate &&
    payload.serviceEndDate < payload.serviceStartDate
  ) {
    errors.push(
      buildValidationError(
        "serviceEndDate",
        "Service End Date must be greater than or equal to Service Start Date."
      )
    );
  }

  return { payload, errors };
}

async function listNonPayrollItems(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "HOD" || req.user.role === "DataFiller") {
      const departmentName = await resolveHodDepartmentName(req.user);
      filter.responsibleDepartment = departmentName;
    } else if (req.query.department) {
      filter.responsibleDepartment = req.query.department;
    }

    const items = await NonPayrollItem.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: items.map(serializeItem),
    });
  } catch (error) {
    return next(error);
  }
}

async function createNonPayrollItem(req, res, next) {
  try {
    const { payload, errors } = buildPayloadFromBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to create the record.",
        errors,
      });
    }

    if (req.user.role === "HOD" || req.user.role === "DataFiller") {
      payload.responsibleDepartment = await resolveHodDepartmentName(req.user);
    }

    applyCalculatedFields(payload);

    const item = await NonPayrollItem.create(payload);
    return res.status(201).json({
      success: true,
      data: serializeItem(item),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Unique ID ${req.body.uniqueId} already exists.`,
      });
    }
    return next(error);
  }
}

async function updateNonPayrollItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await NonPayrollItem.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    let hodDepartmentName = null;
    if (req.user.role === "HOD" || req.user.role === "DataFiller") {
      hodDepartmentName = await resolveHodDepartmentName(req.user);
      if (existing.responsibleDepartment !== hodDepartmentName) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to modify this record.",
        });
      }
    }

    const { payload, errors } = buildPayloadFromBody(req.body, {
      partial: true,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to update the record.",
        errors,
      });
    }

    if (req.user.role === "HOD" || req.user.role === "DataFiller") {
      payload.responsibleDepartment = hodDepartmentName ?? existing.responsibleDepartment;
    } else if (payload.responsibleDepartment === undefined) {
      payload.responsibleDepartment = existing.responsibleDepartment;
    }

    const nextStart =
      payload.serviceStartDate !== undefined
        ? payload.serviceStartDate
        : existing.serviceStartDate;
    const nextEnd =
      payload.serviceEndDate !== undefined
        ? payload.serviceEndDate
        : existing.serviceEndDate;

    if (nextStart && nextEnd && nextEnd < nextStart) {
      return res.status(400).json({
        success: false,
        message:
          "Service End Date must be greater than or equal to Service Start Date.",
      });
    }

    applyCalculatedFields(payload, existing);

    Object.assign(existing, payload);
    await existing.save();

    return res.json({
      success: true,
      data: serializeItem(existing),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Unique ID ${req.body.uniqueId} already exists.`,
      });
    }
    return next(error);
  }
}

async function deleteNonPayrollItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await NonPayrollItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    if (req.user.role === "HOD") {
      const departmentName = await resolveHodDepartmentName(req.user);
      if (item.responsibleDepartment !== departmentName) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to delete this record.",
        });
      }
    }

    await NonPayrollItem.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Record deleted.",
    });
  } catch (error) {
    return next(error);
  }
}

async function exportNonPayrollItems(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "HOD" || req.user.role === "DataFiller") {
      const departmentName = await resolveHodDepartmentName(req.user);
      filter.responsibleDepartment = departmentName;
    } else if (req.query.department) {
      filter.responsibleDepartment = req.query.department;
    }

    const items = await NonPayrollItem.find(filter).sort({
      createdAt: -1,
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Non-Payroll Items", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = COLUMN_DEFINITIONS.map((column) => ({
      header: column.header,
      key: column.key,
      width: 28,
    }));

    items.forEach((item) => {
      const rowData = {
        uniqueId: item.uniqueId,
        responsibleDepartment: item.responsibleDepartment,
        beneficiaryDepartment: item.beneficiaryDepartment,
        responsibleDepartmentHod: item.responsibleDepartmentHod,
        beneficiaryDepartmentHod: item.beneficiaryDepartmentHod,
        type: item.type,
        vendor: item.vendor,
        description: item.description,
        category: item.category,
        product: item.product,
        serviceStartDate: formatDateForExport(item.serviceStartDate),
        serviceEndDate: formatDateForExport(item.serviceEndDate),
        serviceDurationDays: item.serviceDurationDays ?? "",
        budgetedPaymentAmountExcGst: item.budgetedPaymentAmountExcGst ?? "",
        gstAmount: item.gstAmount ?? "",
        budgetedPaymentAmountInclGst: item.budgetedPaymentAmountInclGst ?? "",
        dueMonthForPayment: item.dueMonthForPayment ?? "",
      };
      sheet.addRow(rowData);
    });

    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="non_payroll_items.xlsx"'
    );
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
}

function validateUploadRow(row, rowNumber, rowNumbersByUniqueId) {
  const errors = [];

  REQUIRED_FIELDS.forEach((key) => {
    const value = row[key];
    if (value === undefined || value === null || value === "") {
      errors.push(REQUIRED_UPLOAD_MESSAGE(rowNumber, KEY_TO_HEADER.get(key)));
    }
  });

  NUMERIC_KEYS.forEach((key) => {
    if (key === "budgetedPaymentAmountInclGst") {
      return;
    }
    const value = row[key];
    if (value === undefined || value === null || value === "") {
      errors.push(REQUIRED_UPLOAD_MESSAGE(rowNumber, KEY_TO_HEADER.get(key)));
      return;
    }
    const numberValue = Number(value);
    if (Number.isNaN(numberValue) || numberValue < 0) {
      errors.push(NUMERIC_UPLOAD_MESSAGE(rowNumber, KEY_TO_HEADER.get(key)));
    }
  });

  const startDate = row.serviceStartDate
    ? parseDateInput(row.serviceStartDate).date
    : null;
  const endDate = row.serviceEndDate
    ? parseDateInput(row.serviceEndDate).date
    : null;

  if (startDate && endDate && endDate < startDate) {
    errors.push(DATE_ORDER_MESSAGE(rowNumber));
  }

  const uniqueId = sanitizeString(row.uniqueId);
  if (uniqueId) {
    if (rowNumbersByUniqueId.has(uniqueId)) {
      errors.push(DUPLICATE_MESSAGE(rowNumber, uniqueId));
    } else {
      rowNumbersByUniqueId.set(uniqueId, rowNumber);
    }
  }

  return { errors, startDate, endDate };
}

async function parseUploadFile(file) {
  if (!file) {
    const error = new Error("File is required.");
    error.statusCode = 400;
    throw error;
  }

  const isCsv =
    file.mimetype === "text/csv" ||
    file.originalname.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const text = file.buffer.toString("utf8");
    const records = parse(text, { skip_empty_lines: true });
    const headerRow = records[0]?.map((cell) => cell?.toString().trim());
    const rows = records.slice(1);
    return { headerRow, rows };
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet
    .getRow(1)
    .values.slice(1)
    .map((cell) => (cell ?? "").toString().trim());

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1).map((cell) => {
      if (cell === null || cell === undefined) {
        return "";
      }
      if (cell instanceof Date) {
        return formatDateForExport(cell);
      }
      return cell;
    });
    const isEmpty = values.every(
      (value) => value === null || value === undefined || value === ""
    );
    if (!isEmpty) {
      rows.push(values);
    }
  });

  return { headerRow, rows };
}

function mapRowValuesToObject(values) {
  const row = {};
  HEADER_ORDER.forEach((header, index) => {
    const key = HEADER_TO_KEY.get(header);
    row[key] = values[index] ?? "";
  });
  return row;
}

async function uploadNonPayrollItems(req, res, next) {
  try {
    let hodDepartmentName = null;
    if (req.user.role === "HOD") {
      hodDepartmentName = await resolveHodDepartmentName(req.user);
    }

    const file = req.file;
    const overwrite = req.query.overwrite === "true";
    const { headerRow, rows } = await parseUploadFile(file);

    if (!headerRow || headerRow.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Columns do not match the required format.",
      });
    }

    const matchesHeader =
      HEADER_ORDER.length === headerRow.length &&
      HEADER_ORDER.every(
        (header, index) => header === (headerRow[index] ?? "").trim()
      );

    if (!matchesHeader) {
      return res.status(400).json({
        success: false,
        message: "Columns do not match the required format.",
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No records found in the uploaded file.",
      });
    }

    const errors = [];
    const preparedRows = [];
    const rowNumbersByUniqueId = new Map();

    rows.forEach((values, index) => {
      const rowNumber = index + 2;
      const dataRow = Array.isArray(values) ? values : Object.values(values);
      const mappedRow = mapRowValuesToObject(dataRow);
      const { errors: rowErrors, startDate, endDate } = validateUploadRow(
        mappedRow,
        rowNumber,
        rowNumbersByUniqueId
      );
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        return;
      }

      const payload = {
        uniqueId: sanitizeString(mappedRow.uniqueId),
        responsibleDepartment:
          hodDepartmentName ??
          sanitizeString(mappedRow.responsibleDepartment),
        beneficiaryDepartment: sanitizeString(mappedRow.beneficiaryDepartment),
        responsibleDepartmentHod: sanitizeString(
          mappedRow.responsibleDepartmentHod
        ),
        beneficiaryDepartmentHod: sanitizeString(
          mappedRow.beneficiaryDepartmentHod
        ),
        type: sanitizeString(mappedRow.type),
        vendor: sanitizeString(mappedRow.vendor),
        description: sanitizeString(mappedRow.description),
        category: sanitizeString(mappedRow.category),
        product: sanitizeString(mappedRow.product),
        serviceStartDate: startDate,
        serviceEndDate: endDate,
        budgetedPaymentAmountExcGst: parseNumberInput(
          mappedRow.budgetedPaymentAmountExcGst
        ).value,
        gstAmount: parseNumberInput(mappedRow.gstAmount).value,
        dueMonthForPayment: normalizeMonth(mappedRow.dueMonthForPayment),
      };

      applyCalculatedFields(payload);
      preparedRows.push(payload);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Upload failed.",
        errors,
      });
    }

    const uniqueIds = preparedRows.map((row) => row.uniqueId);
    const existingItems = await NonPayrollItem.find({
      uniqueId: { $in: uniqueIds },
    })
      .select("uniqueId responsibleDepartment")
      .lean();

    if (existingItems.length > 0 && !overwrite) {
      existingItems.forEach((item) => {
        const rowNumber = rowNumbersByUniqueId.get(item.uniqueId);
        errors.push(DUPLICATE_MESSAGE(rowNumber || "-", item.uniqueId));
      });
      return res.status(409).json({
        success: false,
        message: "Upload failed.",
        errors,
      });
    }
    
    if (
      req.user.role === "HOD" &&
      existingItems.some(
        (item) => item.responsibleDepartment !== hodDepartmentName
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot overwrite records that belong to another department.",
      });
    }

    let processedCount = 0;
    const bulkOperations = preparedRows.map((row) => {
      if (overwrite) {
        return NonPayrollItem.updateOne(
          { uniqueId: row.uniqueId },
          { $set: row },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
      return NonPayrollItem.create(row);
    });

    await Promise.all(bulkOperations);
    processedCount = preparedRows.length;

    return res.json({
      success: true,
      message: `${processedCount} records uploaded successfully.`,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listNonPayrollItems,
  createNonPayrollItem,
  updateNonPayrollItem,
  deleteNonPayrollItem,
  exportNonPayrollItems,
  uploadNonPayrollItems,
};