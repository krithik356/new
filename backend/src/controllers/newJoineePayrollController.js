const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const { NewJoineePayroll } = require("../models/NewJoineePayroll");
const { Department } = require("../models/Department");
const { buildNewJoineeWorkbook } = require("../utils/newJoineeSheetExporter");
const {
  syncTARequirementsForRoles,
  syncAllTARequirements,
} = require("../utils/taRequirementAggregator");

const editableFields = [
  "sbuClp",
  "employeeName",
  "doj",
  "designation",
  "departmentLabel",
  "topDepartment",
  "type",
  "sourceDepartment",
  "beneficiaryDepartment",
  "sourceHod",
  "beneficiaryHod",
  "workMode",
  "workLocation",
  "employmentType",
  "remarks",
  "ctcRange",
  "experienceRange",
  "newType",
  "replacementEmployeeName",
  "productOrDomain",
  "assetRequirement",
  "processor",
  "operatingSystem",
  "storage",
  "ram",
  "displaySize",
  "graphicCard",
  "peripherals",
  "headPhone",
  "mobilePhone",
  "scienceSbu",
  "budgetAmount",
  "academy",
  "intensive",
  "niatBatch1",
  "niatBatch2",
  "niatBatch3",
  "others",
  "common",
];

const columnDefinitions = [
  { header: "EMP Name", key: "employeeName" },
  { header: "DOJ", key: "doj", isDate: true },
  { header: "Designation", key: "designation" },
  { header: "Department", key: "departmentLabel" },
  { header: "Top Department", key: "topDepartment" },
  { header: "Type", key: "type" },
  { header: "Source Department", key: "sourceDepartment" },
  { header: "Beneficiary Department", key: "beneficiaryDepartment" },
  { header: "Source HOD", key: "sourceHod" },
  { header: "Beneficiary HOD", key: "beneficiaryHod" },
  { header: "WFO/WFH", key: "workMode" },
  { header: "Work Location", key: "workLocation" },
  { header: "Employment Type", key: "employmentType" },
  { header: "Remarks", key: "remarks" },
  { header: "CTC Range", key: "ctcRange" },
  { header: "Experience Range", key: "experienceRange" },
  { header: "New Type", key: "newType" },
  { header: "Replacement Employee Name", key: "replacementEmployeeName" },
  { header: "Product / Working Domain", key: "productOrDomain" },
  { header: "Asset we have to provide", key: "assetRequirement" },
  { header: "Processor", key: "processor" },
  { header: "Operating System", key: "operatingSystem" },
  { header: "Storage (SSD)", key: "storage" },
  { header: "RAM", key: "ram" },
  { header: "Display Size", key: "displaySize" },
  { header: "Graphic Card", key: "graphicCard" },
  { header: "Peripherals", key: "peripherals" },
  { header: "Head Phone", key: "headPhone" },
  { header: "Mobile Phone", key: "mobilePhone" },
  { header: "Science (SBU)", key: "scienceSbu" },
  { header: "Budget Amount", key: "budgetAmount" },
  { header: "Academy %", key: "academy" },
  { header: "Intensive %", key: "intensive" },
  { header: "NIAT Batch 1 %", key: "niatBatch1" },
  { header: "NIAT Batch 2 %", key: "niatBatch2" },
  { header: "NIAT Batch 3 %", key: "niatBatch3" },
  { header: "Other Percentage", key: "others" },
  { header: "Common Percentage", key: "common" },
];

const percentageFields = [
  "academy",
  "intensive",
  "niatBatch1",
  "niatBatch2",
  "niatBatch3",
  "others",
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
    throw new Error("Unsupported role");
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
  if (Number.isNaN(parsed)) {
    return null;
  }
  // Excel percentage-formatted cells provide decimals (e.g., 0.4 instead of 40%)
  if (parsed > 0 && parsed <= 1 && !value.toString().includes("%")) {
    return Number((parsed * 100).toFixed(2));
  }
  return parsed;
}

function ensurePercentageAllocation(payload) {
  const numbers = percentageFields
    .map((field) => toNumber(payload[field]))
    .filter((value) => value !== null);

  if (numbers.length === 0) {
    return;
  }

  const total = numbers.reduce((sum, value) => sum + value, 0);

  if (Math.round(total * 100) / 100 !== 100) {
    throw new Error("Allocation percentages must equal 100%.");
  }
}

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

async function listNewJoinees(req, res) {
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

      filter.department = userDepartment;
    } else if (queryDepartment) {
      filter.departmentKey = normalizeDepartmentKey(queryDepartment);
    }

    const records = await NewJoineePayroll.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    const normalizedRecords = records.map((record) => {
      if (record.common === undefined && record.comments !== undefined) {
        return {
          ...record,
          common: record.comments,
        };
      }
      return record;
    });

    return res.status(200).json({
      success: true,
      data: normalizedRecords,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch new joinee payroll entries.",
    });
  }
}

async function exportNewJoineeSheet(req, res) {
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
      filter.department = userDepartment;
    } else if (queryDepartment && queryDepartment !== "all") {
      filter.departmentKey = normalizeDepartmentKey(queryDepartment);
    }

    const records = await NewJoineePayroll.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    const workbook = await buildNewJoineeWorkbook(records);
    const fileName = `new_joinee_sheet_${new Date()
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
      message: error.message || "Unable to export new joinee sheet.",
    });
  }
}

async function createNewJoinee(req, res) {
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

    ensurePercentageAllocation(payload);

    const record = await NewJoineePayroll.create(payload);

    await syncTARequirementsForRoles([record.designation]);

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create new joinee entry.",
    });
  }
}

async function updateNewJoinee(req, res) {
  try {
    const { role, id: userId, department: userDepartment } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll entry identifier.",
      });
    }

    const record = await NewJoineePayroll.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll entry not found.",
      });
    }

    if (
      role === "HOD" &&
      record.department &&
      userDepartment &&
      record.department.toString() !== userDepartment.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only edit entries from your department.",
      });
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
    } else if (role === "HOD" || role === "DataFiller") {
      departmentMeta = await resolveDepartmentContext({
        role,
        userDepartment,
        payload: {},
      });
    }

    const previousDesignation = record.designation;

    const updates = normalizeDates({
      ...pickEditableFields(req.body),
      updatedBy: userId,
    });

    ensurePercentageAllocation({ ...record.toObject(), ...updates });

    if (departmentMeta) {
      updates.department = departmentMeta.departmentId;
      updates.departmentKey = departmentMeta.departmentKey;
      updates.departmentLabel = departmentMeta.departmentLabel;
    }

    Object.assign(record, updates);
    await record.save();

    await syncTARequirementsForRoles([
      previousDesignation,
      record.designation,
    ]);

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

async function deleteNewJoinee(req, res) {
  try {
    const { id } = req.params;
    const { role, department: userDepartment } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll entry identifier.",
      });
    }

    const record = await NewJoineePayroll.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll entry not found.",
      });
    }

    if (
      role === "HOD" &&
      record.department &&
      userDepartment &&
      record.department.toString() !== userDepartment.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete entries from your department.",
      });
    }

    await record.deleteOne();

    await syncTARequirementsForRoles([record.designation]);

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

async function uploadNewJoineeSheet(req, res) {
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

      try {
        const mappedPayload = mapRowToPayload(row);

        ensurePercentageAllocation(mappedPayload);

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

        if (!payload.employeeName?.trim()) {
          throw new Error("Employee name is required before import.");
        }

        const identifier = payload.employeeName.trim();
        let record = null;

        if (identifier) {
          const query = {
            employeeName: new RegExp(`^${identifier}$`, "i"),
          };

          if (payload.departmentKey) {
            query.departmentKey = payload.departmentKey;
          }

          record = await NewJoineePayroll.findOne(query);
        }

        if (record) {
          Object.assign(record, payload);
          await record.save();
        } else {
          await NewJoineePayroll.create({
            ...payload,
            createdBy: userId,
          });
        }
      } catch (rowError) {
        const message = rowError?.message || "Unable to process this row.";
        throw new Error(
          message.startsWith("Row ")
            ? message
            : `Row ${rowIndex}: ${message}`
        );
      }
    }

    await syncAllTARequirements();

    return res.status(200).json({
      success: true,
      message: "Sheet uploaded successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to process the uploaded sheet.",
    });
  }
}

module.exports = {
  listNewJoinees,
  exportNewJoineeSheet,
  uploadNewJoineeSheet,
  createNewJoinee,
  updateNewJoinee,
  deleteNewJoinee,
};

