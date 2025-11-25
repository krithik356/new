const mongoose = require("mongoose");
const { ExistingEmployeePayroll } = require("../models/ExistingEmployeePayroll");
const { Department } = require("../models/Department");
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

async function resolveDepartmentContext({ role, userDepartment, payload }) {
  if (role === "HOD") {
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
    return {
      departmentId: null,
      departmentKey: normalizeDepartmentKey(
        payload.departmentKey || payload.departmentLabel
      ),
      departmentLabel: payload.departmentLabel || payload.departmentKey || "",
    };
  }

  return {
    departmentId: null,
    departmentKey: "",
    departmentLabel: "",
  };
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

async function listExistingEmployees(req, res) {
  try {
    const { role, department: userDepartment } = req.user;
    const { department: queryDepartment } = req.query;

    const filter = {};

    if (role === "HOD") {
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

    const records = await ExistingEmployeePayroll.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: records,
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

    if (role === "HOD") {
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

module.exports = {
  listExistingEmployees,
  exportExistingEmployees,
  createExistingEmployee,
  updateExistingEmployee,
  deleteExistingEmployee,
};


