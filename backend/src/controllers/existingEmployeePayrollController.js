const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const { ExistingEmployeePayroll } = require("../models/ExistingEmployeePayroll");
const { Department } = require("../models/Department");
const { User } = require("../models/User");
const { SignOffRequest } = require("../models/SignOffRequest");
const {
  buildExistingEmployeeWorkbook,
} = require("../utils/existingEmployeeSheetExporter");

const editableFields = [
  "empId",
  "empName",
  "doj",
  "doe",
  "month",
  "designation",
  "departmentLabel",
  "topDepartment",
  "type",
  "sourceDepartment",
  "beneficiaryDepartment",
  "sourceHod",
  "beneficiaryHod",
  "workMode",
  "employeeType",
  "universityDetails",
  "location",
  "academy",
  "intensive",
  "niatBatch12",
  "niatBatch3",
  "niatBatch4",
  "others",
  "common",
];

const columnDefinitions = [
  { header: "EMP ID", key: "empId" },
  { header: "EMP Name", key: "empName" },
  { header: "DOJ", key: "doj", isDate: true },
  { header: "DOE", key: "doe", isDate: true },
  { header: "Month", key: "month" },
  { header: "Designation", key: "designation" },
  { header: "Department", key: "departmentLabel" },
  { header: "Top Department", key: "topDepartment" },
  { header: "Type", key: "type" },
  { header: "Source Department", key: "sourceDepartment" },
  { header: "Beneficiary Department", key: "beneficiaryDepartment" },
  { header: "Source HOD", key: "sourceHod" },
  { header: "Beneficiary HOD", key: "beneficiaryHod" },
  { header: "WFO/WFH", key: "workMode" },
  { header: "Employee Type", key: "employeeType" },
  { header: "University Details", key: "universityDetails" },
  { header: "Location", key: "location" },
  { header: "Academy %", key: "academy" },
  { header: "Intensive %", key: "intensive" },
  { header: "NIAT Batch 1&2 %", key: "niatBatch12" },
  { header: "NIAT Batch 3 %", key: "niatBatch3" },
  { header: "NIAT Batch 4 %", key: "niatBatch4" },
  { header: "Other Products", key: "others" },
  { header: "Common Products", key: "common" },
];

const percentageFields = [
  "academy",
  "intensive",
  "niatBatch12",
  "niatBatch3",
  "niatBatch4",
  "others",
  "common",
];

function normalizeDepartmentKey(value) {
  return value ? value.toString().trim().toLowerCase().replace(/\s+/g, "-") : "";
}

async function findDepartmentMetaFromLabel(label) {
  if (!label) {
    return null;
  }

  const regex = new RegExp(`^${label.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  const department = await Department.findOne({
    $or: [{ name: regex }, { code: regex }],
  })
    .select("name code")
    .lean();

  if (!department) {
    return null;
  }

  return {
    departmentId: department._id,
    departmentKey: normalizeDepartmentKey(department.code || department.name),
    departmentLabel: department.name || department.code || "",
  };
}

async function resolveDepartmentContext({ role, userDepartment, payload }) {
  const isHodLike = role === "HOD" || role === "DataFiller";

  if (isHodLike) {
    if (!userDepartment) {
      throw new Error("Department mapping missing for HOD user.");
    }

    const department = await Department.findById(userDepartment)
      .select("name code")
      .lean();

    if (!department) {
      throw new Error("Assigned department not found for the current HOD.");
    }

    return {
      departmentId: department._id,
      departmentKey: normalizeDepartmentKey(department.code || department.name),
      departmentLabel: department.name || department.code || "",
    };
  }

  if (role !== "Admin") {
    throw new Error("Unsupported role.");
  }

  if (payload.departmentId) {
    if (!mongoose.Types.ObjectId.isValid(payload.departmentId)) {
      throw new Error("Invalid department identifier.");
    }

    const department = await Department.findById(payload.departmentId)
      .select("name code")
      .lean();

    if (!department) {
      throw new Error("Department not found.");
    }

    return {
      departmentId: department._id,
      departmentKey: normalizeDepartmentKey(
        payload.departmentKey || department.code || department.name
      ),
      departmentLabel:
        payload.departmentLabel || department.name || department.code || "",
    };
  }

  if (payload.departmentKey || payload.departmentLabel) {
    const fallbackKey = normalizeDepartmentKey(
      payload.departmentKey || payload.departmentLabel
    );

    const inferredDepartment = await findDepartmentMetaFromLabel(
      payload.departmentLabel || payload.departmentKey
    );

    if (inferredDepartment) {
      return inferredDepartment;
    }

    return {
      departmentId: null,
      departmentKey: fallbackKey,
      departmentLabel: payload.departmentLabel || payload.departmentKey || "",
    };
  }

  return {
    departmentId: null,
    departmentKey: "",
    departmentLabel: "",
  };
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function validatePercentageAllocation(payload) {
  const values = percentageFields
    .map((field) => toNumber(payload[field]))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  if (Math.round(total * 100) / 100 !== 100) {
    throw new Error("Allocation percentages must equal 100%.");
  }
}

/**
 * Picks editable fields from request body
 * @param {Object} body - Request body object
 * @returns {Object} Object containing only editable fields
 */
function pickEditableFields(body) {
  return editableFields.reduce((acc, field) => {
    if (body[field] !== undefined) {
      acc[field] = body[field];
    }
    return acc;
  }, {});
}

function normalizeDates(payload) {
  const cloned = { ...payload };
  if (cloned.doj) {
    cloned.doj = new Date(cloned.doj);
  }
  if (cloned.doe) {
    cloned.doe = new Date(cloned.doe);
  }
  return cloned;
}

function normalizeHeaderValue(cell) {
  if (!cell) {
    return "";
  }
  const rawValue =
    typeof cell === "string"
      ? cell
      : cell?.text ?? cell?.result ?? cell?.toString?.() ?? "";
  return rawValue
    .toString()
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function validateWorksheetColumns(worksheet) {
  const headerRow = worksheet.getRow(1);
  const receivedHeaders = headerRow.values.slice(1);

  if (receivedHeaders.length !== columnDefinitions.length) {
    const difference = receivedHeaders.length - columnDefinitions.length;
    const hint =
      difference > 0
        ? `${Math.abs(difference)} extra column(s)`
        : `${Math.abs(difference)} missing column(s)`;
    throw new Error(
      `Sheet header has ${receivedHeaders.length} column(s) but ${columnDefinitions.length} are required (${hint}). Please download the latest template using "Generate Sheet".`
    );
  }

  columnDefinitions.forEach((column, index) => {
    const expected = normalizeHeaderValue(column.header);
    const actual = normalizeHeaderValue(receivedHeaders[index]);
    if (expected !== actual) {
      const displayActual =
        typeof receivedHeaders[index] === "object"
          ? receivedHeaders[index]?.text ??
            receivedHeaders[index]?.result ??
            receivedHeaders[index]?.toString?.() ??
            ""
          : receivedHeaders[index] ?? "";
      throw new Error(
        `Column ${index + 1} is "${displayActual}" but should be "${
          column.header
        }". Please ensure the header row matches the generated template exactly (formatting such as bold/italics is ignored).`
      );
    }
  });
}

function mapRowToPayload(row) {
  const payload = {};

  columnDefinitions.forEach((column, index) => {
    const cell = row.getCell(index + 1).value;
    if (column.isDate) {
      if (!cell) {
        payload[column.key] = null;
      } else if (cell instanceof Date) {
        payload[column.key] = cell;
      } else if (cell?.result) {
        const date = new Date(cell.result);
        payload[column.key] = Number.isNaN(date.getTime()) ? null : date;
      } else {
        const date = new Date(cell);
        payload[column.key] = Number.isNaN(date.getTime()) ? null : date;
      }
    } else if (typeof cell === "object" && cell?.text) {
      payload[column.key] = cell.text.trim();
    } else if (cell === null || cell === undefined) {
      payload[column.key] = "";
    } else {
      payload[column.key] = cell.toString().trim();
    }
  });

  return payload;
}

async function listExistingEmployees(req, res) {
  try {
    // Verify model is loaded
    if (!ExistingEmployeePayroll || typeof ExistingEmployeePayroll.find !== "function") {
      console.error("FATAL: ExistingEmployeePayroll model not loaded correctly!");
      console.error("Model value:", ExistingEmployeePayroll);
      return res.status(500).json({
        success: false,
        message: "Server configuration error. Please restart the server.",
      });
    }

    const { role, department: userDepartment } = req.user;
    const { department: queryDepartment } = req.query;

    const filter = {};

    if (role === "HOD" || role === "DataFiller") {
      if (!userDepartment) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "Department mapping missing for current HOD.",
        });
      }

      const { id: userId } = req.user;

      // HOD sees:
      // 1. Their own department's records
      // 2. Pending sign-offs targeted to their department (to accept/reject)
      // 3. Records they requested sign-off for (to see status and edit/delete)
      const pendingSignOffs = await SignOffRequest.find({
        targetDepartment: userDepartment,
        status: "pending",
      })
        .select("payrollRecord")
        .lean();

      const requestedSignOffs = await SignOffRequest.find({
        requestedBy: userId,
      })
        .select("payrollRecord")
        .lean();

      const pendingPayrollIds = pendingSignOffs.map((s) => s.payrollRecord);
      const requestedPayrollIds = requestedSignOffs.map((s) => s.payrollRecord);

      // Combine all IDs that should be visible
      const allVisibleIds = [
        ...new Set([
          ...pendingPayrollIds.map((id) => id.toString()),
          ...requestedPayrollIds.map((id) => id.toString()),
        ]),
      ];

      if (allVisibleIds.length > 0) {
        filter.$or = [
          { department: userDepartment },
          { _id: { $in: allVisibleIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        ];
      } else {
        filter.department = userDepartment;
      }
    } else if (role === "Admin") {
      // Admin sees all records, optionally filtered by queryDepartment
      if (queryDepartment && queryDepartment !== "all") {
        filter.departmentKey = normalizeDepartmentKey(queryDepartment);
      }
    } else if (queryDepartment) {
      filter.departmentKey = normalizeDepartmentKey(queryDepartment);
    }

    const records = await ExistingEmployeePayroll.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    // Get sign-off request status for each record (including accepted/rejected)
    const recordIds = records.map((r) => r._id);
    const signOffRequests = await SignOffRequest.find({
      payrollRecord: { $in: recordIds },
    })
      .select("payrollRecord status targetDepartment remark requestedBy")
      .lean();

    // Create a map of payroll record ID to sign-off request
    const signOffMap = {};
    signOffRequests.forEach((req) => {
      signOffMap[req.payrollRecord.toString()] = {
        status: req.status,
        targetDepartment: req.targetDepartment,
        remark: req.remark,
        requestedBy: req.requestedBy,
      };
    });

    // Add sign-off status to each record
    // For HODs: show pending if targeted to their department, or show all statuses if they requested it
    // For Admins: show all sign-off statuses
    const { id: userId } = req.user;
    const recordsWithSignOff = records.map((record) => {
      const signOffInfo = signOffMap[record._id.toString()];
      let signoffStatus = null;
      
      if (signOffInfo) {
        if (role === "HOD" || role === "DataFiller") {
          // Show pending if targeted to their department (so they can accept/reject)
          if (
            userDepartment &&
            signOffInfo.targetDepartment &&
            signOffInfo.targetDepartment.toString() === userDepartment.toString()
          ) {
            signoffStatus = signOffInfo.status;
          }
          // Also show all statuses (pending, accepted, rejected) if they were the requester
          // This ensures they can see the status of their sign-off requests
          else if (
            signOffInfo.requestedBy &&
            signOffInfo.requestedBy.toString() === userId.toString()
          ) {
            signoffStatus = signOffInfo.status;
          }
        } else {
          // For Admins, show all sign-off statuses
          signoffStatus = signOffInfo.status;
        }
      }

      return {
        ...record,
        signoffStatus,
        signoffTargetDepartment: signOffInfo?.targetDepartment || null,
        signoffRemark: signOffInfo?.remark || null,
        signoffRequestedBy: signOffInfo?.requestedBy || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: recordsWithSignOff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch existing employee payroll entries.",
    });
  }
}

async function exportExistingEmployees(req, res) {
  try {
    const { role, department: userDepartment } = req.user;
    const { department: queryDepartment } = req.query;

    const filter = {};

    if (role === "HOD" || role === "DataFiller") {
      if (!userDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department mapping missing for current HOD.",
        });
      }

      const { id: userId } = req.user;

      // HOD sees:
      // 1. Their own department's records
      // 2. Pending sign-offs targeted to their department (to accept/reject)
      // 3. Records they requested sign-off for (to see status and edit/delete)
      const pendingSignOffs = await SignOffRequest.find({
        targetDepartment: userDepartment,
        status: "pending",
      })
        .select("payrollRecord")
        .lean();

      const requestedSignOffs = await SignOffRequest.find({
        requestedBy: userId,
      })
        .select("payrollRecord")
        .lean();

      const pendingPayrollIds = pendingSignOffs.map((s) => s.payrollRecord);
      const requestedPayrollIds = requestedSignOffs.map((s) => s.payrollRecord);

      // Combine all IDs that should be visible
      const allVisibleIds = [
        ...new Set([
          ...pendingPayrollIds.map((id) => id.toString()),
          ...requestedPayrollIds.map((id) => id.toString()),
        ]),
      ];

      if (allVisibleIds.length > 0) {
        filter.$or = [
          { department: userDepartment },
          { _id: { $in: allVisibleIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        ];
      } else {
        filter.department = userDepartment;
      }
    } else if (queryDepartment && queryDepartment !== "all") {
      filter.departmentKey = normalizeDepartmentKey(queryDepartment);
    }

    const records = await ExistingEmployeePayroll.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    const workbook = await buildExistingEmployeeWorkbook(records);
    const fileName = `existing_employees_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to export existing employee sheet.",
    });
  }
}

async function createExistingEmployee(req, res) {
  try {
    const { role, id: userId, department: userDepartment } = req.user;

    const departmentMeta = await resolveDepartmentContext({
      role,
      userDepartment,
      payload: {
        departmentId: req.body.departmentId,
        departmentKey: req.body.departmentKey || req.body.department,
        departmentLabel:
          req.body.departmentLabel || req.body.departmentName || "",
      },
    });

    const payload = normalizeDates({
      ...pickEditableFields(req.body),
      department: departmentMeta.departmentId,
      departmentKey: departmentMeta.departmentKey,
      departmentLabel: departmentMeta.departmentLabel,
      createdBy: userId,
      updatedBy: userId,
    });

    validatePercentageAllocation(payload);

    const record = await ExistingEmployeePayroll.create(payload);

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create existing employee entry.",
    });
  }
}

async function updateExistingEmployee(req, res) {
  try {
    const { role, id: userId, department: userDepartment } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll entry identifier.",
      });
    }

    const record = await ExistingEmployeePayroll.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll entry not found.",
      });
    }

    // Check if HOD can edit: either from their department OR they requested sign-off that was accepted
    if (role === "HOD") {
      const canEditOwnDepartment =
        record.department &&
        userDepartment &&
        record.department.toString() === userDepartment.toString();

      // Check if user is the original requester of an accepted sign-off
      let canEditAsRequester = false;
      if (!canEditOwnDepartment) {
        const acceptedSignOff = await SignOffRequest.findOne({
          payrollRecord: id,
          status: "accepted",
          requestedBy: userId,
        }).lean();

        if (acceptedSignOff) {
          canEditAsRequester = true;
        }
      }

      if (!canEditOwnDepartment && !canEditAsRequester) {
        return res.status(403).json({
          success: false,
          message: "You can only edit entries from your department or entries you requested sign-off for.",
        });
      }
    }

    let departmentMeta = null;

    if (role === "Admin" && (req.body.departmentId || req.body.departmentKey)) {
      departmentMeta = await resolveDepartmentContext({
        role,
        payload: {
          departmentId: req.body.departmentId,
          departmentKey: req.body.departmentKey || req.body.department,
          departmentLabel:
            req.body.departmentLabel || req.body.departmentName || "",
        },
      });
    } else if (role === "HOD") {
      departmentMeta = await resolveDepartmentContext({
        role,
        userDepartment,
        payload: {},
      });
    }

    const updates = normalizeDates({
      ...pickEditableFields(req.body),
      updatedBy: userId,
    });

    // Remove undefined values to prevent overwriting with undefined
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    validatePercentageAllocation({ ...record.toObject(), ...updates });

    if (departmentMeta) {
      updates.department = departmentMeta.departmentId;
      updates.departmentKey = departmentMeta.departmentKey;
      updates.departmentLabel = departmentMeta.departmentLabel;
    }

    Object.assign(record, updates);
    await record.save();

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update payroll entry.",
    });
  }
}

async function deleteExistingEmployee(req, res) {
  try {
    const { id } = req.params;
    const { role, department: userDepartment } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll entry identifier.",
      });
    }

    const record = await ExistingEmployeePayroll.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll entry not found.",
      });
    }

    // Check if HOD can delete: either from their department OR they requested sign-off that was accepted
    if (role === "HOD") {
      const canDeleteOwnDepartment =
        record.department &&
        userDepartment &&
        record.department.toString() === userDepartment.toString();

      // Check if user is the original requester of an accepted sign-off
      let canDeleteAsRequester = false;
      if (!canDeleteOwnDepartment) {
        const acceptedSignOff = await SignOffRequest.findOne({
          payrollRecord: id,
          status: "accepted",
          requestedBy: userId,
        }).lean();

        if (acceptedSignOff) {
          canDeleteAsRequester = true;
        }
      }

      if (!canDeleteOwnDepartment && !canDeleteAsRequester) {
        return res.status(403).json({
          success: false,
          message: "You can only delete entries from your department or entries you requested sign-off for.",
        });
      }
    }

    await record.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Payroll entry removed.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to delete payroll entry.",
    });
  }
}

async function uploadExistingEmployeesSheet(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid .xlsx file.",
      });
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(req.file.buffer);
    } catch (loadError) {
      return res.status(400).json({
        success: false,
        message: "Invalid Excel file format. Please ensure the file is a valid .xlsx file.",
      });
    }

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded workbook has no worksheets. Please ensure the Excel file contains at least one sheet.",
      });
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Uploaded workbook is empty.",
      });
    }

    if (worksheet.rowCount < 2) {
      return res.status(400).json({
        success: false,
        message: "Uploaded sheet has no data rows. Please ensure the sheet contains at least one data row after the header.",
      });
    }

    validateWorksheetColumns(worksheet);

    const { role, id: userId, department: userDepartment } = req.user;

    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex);
      if (row.values.filter(Boolean).length === 0) {
        continue;
      }

      const mappedPayload = mapRowToPayload(row);

      validatePercentageAllocation(mappedPayload);

      const departmentMeta = await resolveDepartmentContext({
        role,
        userDepartment,
        payload: {
          departmentKey: mappedPayload.departmentLabel,
          departmentLabel: mappedPayload.departmentLabel,
        },
      });

      const payload = normalizeDates({
        ...mappedPayload,
        department: departmentMeta.departmentId,
        departmentKey: departmentMeta.departmentKey,
        departmentLabel: departmentMeta.departmentLabel,
        updatedBy: userId,
      });

      if (!payload.empName?.trim()) {
        throw new Error(
          `Row ${rowIndex}: Employee name is required before import.`
        );
      }

      const identifier = payload.empId?.trim();
      let record = null;

      if (identifier) {
        record = await ExistingEmployeePayroll.findOne({ empId: identifier });
      }

      if (record) {
        Object.assign(record, payload);
        await record.save();
      } else {
        await ExistingEmployeePayroll.create({
          ...payload,
          createdBy: userId,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Sheet uploaded successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message || "Unable to process the uploaded existing employee sheet.",
    });
  }
}

// Mapping from Source Department names (as they appear in the sheet) to Department names in DB
const SOURCE_DEPARTMENT_TO_DB_DEPARTMENT = {
  Management: "Management",
  Sales: "Sales",
  "Pre-Sales": "Pre-Sales",
  "Sales - Intensive": "Sales - Intensive",
  "Content Marketing": "Content Marketing",
  "Placement - Corporate Relations": "Placement - Corporate Relations",
  Technology: "Technology",
  "Student Success - Academy": "Student Success - Academy",
  "Student Success - Intensive": "Student Success - Intensive",
  "Placement Success Manager": "Placement Success Manager",
  "Query Resolution": "Query Resolution",
  "NIAT - Academics": "NIAT - Academics",
  "Video House": "Video House",
  PRE: "PRE",
  "Content - DS&ML": "Content - DS&ML",
  "University Partnership": "University Partnership",
  "Talent Acquisition": "Talent Acquisition",
  Product: "Product",
  "Business Ops": "Business Ops",
  "Placement - Content": "Placement - Content",
  "NIAT Masterclass": "NIAT Masterclass",
  "NIAT - Robotics": "NIAT - Robotics",
  "Content - DS&Algo": "Content - DS&Algo",
  "Student Success - NIAT": "Student Success - NIAT",
  "Human Resource": "Human Resource",
  "NIAT - Program Ops": "NIAT - Program Ops",
  Abroad: "Abroad",
  "Founders Office": "Founders Office",
  "Product Design": "Product Design",
  "Graphic Design": "Graphic Design",
  "10xIIT": "10xIIT",
  "NxtWave Edge - Colleges": "NxtWave Edge - Colleges",
  "Intensive Offline": "Intensive Offline",
  "Assessments POD": "Assessments POD",
  "Internal Audit": "Internal Audit",
  Finance: "Finance",
  "GenAI Social Media": "GenAI Social Media",
  "AI&Beyond": "AI&Beyond",
  "Content - MERN": "Content - MERN",
  "HR - Admin/Facilities": "HR - Admin/Facilities",
  Branding: "Branding",
  "HR - Learning & Development": "HR - Learning & Development",
  "Policy & Strategic Partnerships": "Policy & Strategic Partnerships",
  NIFA: "NIFA",
  "Pre-Sales - Intensive": "Pre-Sales - Intensive",
  "NIAT - Hiring team": "NIAT - Hiring team",
  Masterclass: "Masterclass",
  "NxtGen LP": "NxtGen LP",
  "Chemistry Dept": "CT", // Map Chemistry Dept to CT
  CT: "CT", // Also map CT directly
};

/**
 * Finds a Department document by source department name
 * Handles various formats and mappings
 */
async function findDepartmentBySourceDepartmentName(sourceDeptName) {
  if (!sourceDeptName) return null;

  // Clean the source department name (remove extra spaces, trim)
  const cleanName = sourceDeptName.trim();

  // First try exact mapping
  const dbDeptName = SOURCE_DEPARTMENT_TO_DB_DEPARTMENT[cleanName];
  if (dbDeptName) {
    const escaped = dbDeptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const department = await Department.findOne({
      $or: [
        { name: new RegExp(`^${escaped}$`, "i") },
        { code: new RegExp(`^${escaped}$`, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  // Try exact match with cleaned name
  const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let department = await Department.findOne({
    $or: [
      { name: new RegExp(`^${escaped}$`, "i") },
      { code: new RegExp(`^${escaped}$`, "i") },
    ],
  }).lean();
  if (department) return department;

  // Try partial match (contains) - more flexible
  const partialEscaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  department = await Department.findOne({
    $or: [
      { name: new RegExp(partialEscaped, "i") },
      { code: new RegExp(partialEscaped, "i") },
    ],
  }).lean();
  if (department) return department;

  // Try to extract department name if it contains parentheses
  const parenMatch = cleanName.match(/^(.+?)\s*\(/);
  if (parenMatch) {
    const extractedName = parenMatch[1].trim();
    const extractedEscaped = extractedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { name: new RegExp(`^${extractedEscaped}$`, "i") },
        { name: new RegExp(extractedEscaped, "i") },
        { code: new RegExp(`^${extractedEscaped}$`, "i") },
        { code: new RegExp(extractedEscaped, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  // Try to extract code from parentheses
  const codeMatch = cleanName.match(/\(([^)]+)\)/);
  if (codeMatch) {
    const extractedCode = codeMatch[1].trim();
    const codeEscaped = extractedCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { code: new RegExp(`^${codeEscaped}$`, "i") },
        { code: new RegExp(codeEscaped, "i") },
        { name: new RegExp(`^${codeEscaped}$`, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  // Try removing common suffixes like "Dept", "Department", etc.
  const nameWithoutSuffix = cleanName
    .replace(/\s+Dept\.?$/i, "")
    .replace(/\s+Department\.?$/i, "")
    .trim();
  if (nameWithoutSuffix !== cleanName) {
    const suffixEscaped = nameWithoutSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { name: new RegExp(`^${suffixEscaped}$`, "i") },
        { name: new RegExp(suffixEscaped, "i") },
        { code: new RegExp(`^${suffixEscaped}$`, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  // Final fallback: try to find any department that contains the key word(s)
  const words = cleanName
    .replace(/\s+Dept\.?$/i, "")
    .replace(/\s+Department\.?$/i, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length > 0) {
    const firstWord = words[0];
    const wordEscaped = firstWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    department = await Department.findOne({
      $or: [
        { name: new RegExp(wordEscaped, "i") },
        { code: new RegExp(wordEscaped, "i") },
      ],
    }).lean();
    if (department) return department;
  }

  return null;
}

/**
 * Request sign-off for an existing employee payroll record
 * Creates a sign-off request targeting the source department's HOD
 */
async function requestSignOff(req, res) {
  try {
    const { id: userId } = req.user;
    const { id } = req.params;

    const record = await ExistingEmployeePayroll.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Existing employee record not found.",
      });
    }

    if (!record.sourceDepartment) {
      return res.status(400).json({
        success: false,
        message: "Source Department is required to request sign-off.",
      });
    }

    // Check if there's already a sign-off request for this record (pending or completed)
    const existingRequest = await SignOffRequest.findOne({
      payrollRecord: id,
    }).sort({ createdAt: -1 }); // Get the most recent one

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "A pending sign-off request already exists for this record.",
        });
      }
      // Prevent duplicate sign-off requests even if previous one was completed
      return res.status(400).json({
        success: false,
        message: "A sign-off request has already been processed for this record. Cannot request again.",
      });
    }

    // Find the target department based on source department name
    const targetDepartment = await findDepartmentBySourceDepartmentName(
      record.sourceDepartment
    );

    if (!targetDepartment) {
      // Debug: Log available departments for troubleshooting
      const allDepartments = await Department.find({})
        .select("name code")
        .lean();
      console.error(
        `[SignOff] Could not find department for Source Department: "${record.sourceDepartment}"`
      );
      console.error(
        `[SignOff] Available departments:`,
        allDepartments.map((d) => `${d.name} (${d.code || "no code"})`)
      );

      return res.status(400).json({
        success: false,
        message: `Could not find department for Source Department: ${record.sourceDepartment}. Please ensure the Source Department matches an existing department in the system.`,
      });
    }

    // Create sign-off request
    const signOffRequest = await SignOffRequest.create({
      payrollRecord: id,
      status: "pending",
      targetDepartment: targetDepartment._id,
      requestedBy: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Sign-off request sent successfully.",
      data: signOffRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to request sign-off.",
    });
  }
}

/**
 * HOD decides on a sign-off request (accept or reject)
 * The id parameter is the payroll record ID (to match frontend expectations)
 */
async function decideSignOff(req, res) {
  try {
    const { id: userId, department: userDepartment } = req.user;
    const { id: payrollRecordId } = req.params;
    const { decision, remark } = req.body;

    if (!decision || !["accepted", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'accepted' or 'rejected'.",
      });
    }

    if (decision === "rejected" && !remark?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Remark is required when rejecting a sign-off request.",
      });
    }

    // Find the pending sign-off request for this payroll record
    const signOffRequest = await SignOffRequest.findOne({
      payrollRecord: payrollRecordId,
      status: "pending",
    }).populate("payrollRecord");

    if (!signOffRequest) {
      return res.status(404).json({
        success: false,
        message: "Pending sign-off request not found for this record.",
      });
    }

    // Verify this HOD is authorized to decide on this sign-off
    if (
      !signOffRequest.targetDepartment ||
      signOffRequest.targetDepartment.toString() !== userDepartment?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to decide on this sign-off request.",
      });
    }

    // Update sign-off request
    signOffRequest.status = decision;
    signOffRequest.decidedBy = userId;
    signOffRequest.remark = decision === "rejected" ? remark?.trim() || "" : "";

    await signOffRequest.save();

    // If accepted, update the payroll record's department to the HOD's department
    if (decision === "accepted" && signOffRequest.payrollRecord) {
      const payrollRecord = await ExistingEmployeePayroll.findById(
        payrollRecordId
      );

      if (payrollRecord) {
        payrollRecord.department = userDepartment;
        const hodDepartment = await Department.findById(userDepartment).lean();
        if (hodDepartment) {
          payrollRecord.departmentKey = normalizeDepartmentKey(
            hodDepartment.code || hodDepartment.name
          );
          payrollRecord.departmentLabel =
            hodDepartment.name || hodDepartment.code || "";
        }
        await payrollRecord.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sign-off request ${decision} successfully.`,
      data: signOffRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process sign-off decision.",
    });
  }
}

module.exports = {
  listExistingEmployees,
  exportExistingEmployees,
  createExistingEmployee,
  updateExistingEmployee,
  deleteExistingEmployee,
  uploadExistingEmployeesSheet,
  requestSignOff,
  decideSignOff,
};


