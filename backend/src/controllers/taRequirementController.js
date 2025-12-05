const mongoose = require("mongoose");
const { TARequirement } = require("../models/TARequirement");
const { Department } = require("../models/Department");
const {
  normalizeDepartmentKey,
  normalizeRoleName,
  syncTARequirementsForRoles,
  syncAllTARequirements,
} = require("../utils/taRequirementAggregator");
const { buildTARequirementWorkbook } = require("../utils/taRequirementSheetExporter");

const { Types } = mongoose;

const numericFields = [
  "noOfPositions",
  "januaryPositions",
  "februaryPositions",
  "marchPositions",
  "minCTC",
  "maxCTC",
];

const editableFields = [
  "hodName",
  "hiringManagerName",
  "roleName",
  "ctcRange",
  "minCTC",
  "maxCTC",
  "workLocation",
  "employmentType",
  "employmentTypeRemarks",
  "topDepartment",
  "department",
  "beneficiaryDepartment",
  "experienceRange",
  "hireType",
  "hiringStatus",
  "replacementEmployeeName",
  "productWorkingOn",
  "jdLink",
  "assetToProvide",
  "processor",
  "operatingSystem",
  "storage",
  "ram",
  "displaySize",
  "graphicCard",
  "peripherals",
  "ipad",
  "headphones",
  "mobilePhones",
  "externalSsds",
  "budgetAmount",
  "sourceDepartment",
];

const arrayFields = [
  "departmentLabels",
  "departmentKeys",
  "sourceDepartmentKeys",
  "beneficiaryDepartmentKeys",
];

const toStringValue = (value) =>
  value === null || value === undefined ? "" : value.toString().trim();

const toStringArray = (value = []) =>
  Array.isArray(value)
    ? value
        .map((entry) => toStringValue(entry))
        .filter((entry) => entry.length > 0)
    : [];

const toNormalizedKeyArray = (value = []) =>
  toStringArray(value).map((entry) => normalizeDepartmentKey(entry));

const toObjectIdArray = (value = []) =>
  Array.isArray(value)
    ? value
        .map((entry) => {
          if (entry instanceof Types.ObjectId) {
            return entry;
          }
          if (Types.ObjectId.isValid(entry)) {
            return new Types.ObjectId(entry);
          }
          return null;
        })
        .filter(Boolean)
    : [];

const buildPayload = ({ body, userId, isCreate }) => {
  const payload = {};

  editableFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = toStringValue(body[field]);
    }
  });

  numericFields.forEach((field) => {
    if (body[field] !== undefined) {
      const parsed = Number(body[field]);
      payload[field] = Number.isNaN(parsed) ? 0 : parsed;
    }
  });

  arrayFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = toStringArray(body[field]);
    }
  });

  if (body.departmentKeys !== undefined) {
    payload.departmentKeys = toNormalizedKeyArray(body.departmentKeys);
  }

  if (body.sourceDepartmentKeys !== undefined) {
    payload.sourceDepartmentKeys = toNormalizedKeyArray(
      body.sourceDepartmentKeys
    );
  }

  if (body.beneficiaryDepartmentKeys !== undefined) {
    payload.beneficiaryDepartmentKeys = toNormalizedKeyArray(
      body.beneficiaryDepartmentKeys
    );
  }

  if (body.departmentIds !== undefined) {
    payload.departmentIds = toObjectIdArray(body.departmentIds);
  }

  if (payload.roleName) {
    payload.roleNameNormalized = normalizeRoleName(payload.roleName);
  }

  if (userId) {
    payload.updatedBy = userId;
    if (isCreate) {
      payload.createdBy = userId;
    }
  }

  return payload;
};

async function listTARequirements(req, res) {
  try {
    const { role, department: userDepartment } = req.user;
    const { department: queryDepartment } = req.query;

    const filter = {};

    // For HOD/DataFiller users, filter TA Requirements to only show those
    // aggregated from their own department's New Joinee entries
    if (role === "HOD" || role === "DataFiller") {
      if (!userDepartment) {
        // For HOD without department mapping, return empty data instead of 400
        return res.status(200).json({
          success: true,
          data: [],
          message: "Department mapping missing for current HOD. No data to display.",
        });
      }

      // Get department details to match against departmentIds, departmentKeys, and departmentLabels
      const department = await Department.findById(userDepartment)
        .select("name code")
        .lean();

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Assigned department not found for the current HOD.",
        });
      }

      // Filter TA Requirements where the HOD's department is in the departmentIds array
      // or matches departmentKeys/departmentLabels
      const departmentIdString = userDepartment.toString();
      const departmentKey = normalizeDepartmentKey(department.code || department.name);
      const departmentLabel = department.name;

      filter.$or = [
        { departmentIds: { $in: [new mongoose.Types.ObjectId(userDepartment)] } },
        { departmentKeys: { $in: [departmentKey] } },
        { departmentLabels: { $in: [departmentLabel] } },
      ];
    } else if (queryDepartment && queryDepartment !== "all") {
      // Admin filtering by query parameter
      const normalizedDepartment = normalizeDepartmentKey(queryDepartment);
      if (normalizedDepartment) {
        filter.departmentKeys = normalizedDepartment;
      }
    }

    let data = await TARequirement.find(filter).sort({ roleName: 1 }).lean();

    // If there are no TA records yet, rebuild everything from New Joinees
    // Note: syncAllTARequirements aggregates all departments, but the filter
    // will still restrict what HODs see
    if (data.length === 0) {
      const rebuilt = await syncAllTARequirements();
      if (rebuilt.length > 0) {
        data = await TARequirement.find(filter).sort({ roleName: 1 }).lean();
      }
    } else {
      // Backfill newer fields like hiringStatus for existing TA records
      const hasMissingHiringStatus = data.some(
        (item) => !item.hiringStatus || item.hiringStatus.trim().length === 0
      );

      if (hasMissingHiringStatus) {
        const rebuilt = await syncAllTARequirements();
        if (rebuilt.length > 0) {
          data = await TARequirement.find(filter).sort({ roleName: 1 }).lean();
        }
      }
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch TA requirements.",
    });
  }
}

async function createTARequirement(req, res) {
  try {
    const { id: userId } = req.user;

    const payload = buildPayload({
      body: req.body,
      userId,
      isCreate: true,
    });

    if (!payload.roleName) {
      return res.status(400).json({
        success: false,
        message: "Role name is required.",
      });
    }

    if (!payload.roleNameNormalized) {
      payload.roleNameNormalized = normalizeRoleName(payload.roleName);
    }

    const record = await TARequirement.create(payload);

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create TA requirement entry.",
    });
  }
}

async function updateTARequirement(req, res) {
  try {
    const { id } = req.params;
    const { id: userId, role, department: userDepartment } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid TA requirement identifier.",
      });
    }

    const record = await TARequirement.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "TA requirement entry not found.",
      });
    }

    // For HOD/DataFiller users, ensure they can only update TA Requirements
    // that belong to their department
    if (role === "HOD" || role === "DataFiller") {
      if (!userDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department mapping missing for current HOD.",
        });
      }

      const department = await Department.findById(userDepartment)
        .select("name code")
        .lean();

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Assigned department not found for the current HOD.",
        });
      }

      const departmentIdString = userDepartment.toString();
      const departmentKey = normalizeDepartmentKey(department.code || department.name);
      const departmentLabel = department.name;

      // Check if the TA Requirement belongs to the HOD's department
      const belongsToDepartment =
        (record.departmentIds &&
          record.departmentIds.some(
            (id) => id.toString() === departmentIdString
          )) ||
        (record.departmentKeys && record.departmentKeys.includes(departmentKey)) ||
        (record.departmentLabels && record.departmentLabels.includes(departmentLabel));

      if (!belongsToDepartment) {
        return res.status(403).json({
          success: false,
          message: "You can only update TA requirements from your department.",
        });
      }
    }

    const payload = buildPayload({
      body: req.body,
      userId,
      isCreate: false,
    });

    Object.assign(record, payload);
    await record.save();

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update TA requirement entry.",
    });
  }
}

async function deleteTARequirement(req, res) {
  try {
    const { id } = req.params;
    const { role, department: userDepartment } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid TA requirement identifier.",
      });
    }

    const record = await TARequirement.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "TA requirement entry not found.",
      });
    }

    // For HOD/DataFiller users, ensure they can only delete TA Requirements
    // that belong to their department
    if (role === "HOD" || role === "DataFiller") {
      if (!userDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department mapping missing for current HOD.",
        });
      }

      const department = await Department.findById(userDepartment)
        .select("name code")
        .lean();

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Assigned department not found for the current HOD.",
        });
      }

      const departmentIdString = userDepartment.toString();
      const departmentKey = normalizeDepartmentKey(department.code || department.name);
      const departmentLabel = department.name;

      // Check if the TA Requirement belongs to the HOD's department
      const belongsToDepartment =
        (record.departmentIds &&
          record.departmentIds.some(
            (id) => id.toString() === departmentIdString
          )) ||
        (record.departmentKeys && record.departmentKeys.includes(departmentKey)) ||
        (record.departmentLabels && record.departmentLabels.includes(departmentLabel));

      if (!belongsToDepartment) {
        return res.status(403).json({
          success: false,
          message: "You can only delete TA requirements from your department.",
        });
      }
    }

    await record.deleteOne();

    return res.status(200).json({
      success: true,
      message: "TA requirement entry removed.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to delete TA requirement entry.",
    });
  }
}

async function syncTARequirements(req, res) {
  try {
    const { roles } = req.body || {};
    const roleList = Array.isArray(roles)
      ? roles
          .map((role) => toStringValue(role))
          .filter((role) => role.length > 0)
      : [];

    const data =
      roleList.length > 0
        ? await syncTARequirementsForRoles(roleList)
        : await syncAllTARequirements();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to sync TA requirements.",
    });
  }
}

async function exportTARequirementSheet(req, res) {
  try {
    const { role, department: userDepartment } = req.user;
    const { department: queryDepartment } = req.query;

    const filter = {};

    // For HOD/DataFiller users, filter TA Requirements to only show those
    // aggregated from their own department's New Joinee entries
    if (role === "HOD" || role === "DataFiller") {
      if (!userDepartment) {
        return res.status(400).json({
          success: false,
          message: "Department mapping missing for current HOD.",
        });
      }

      // Get department details to match against departmentIds, departmentKeys, and departmentLabels
      const department = await Department.findById(userDepartment)
        .select("name code")
        .lean();

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Assigned department not found for the current HOD.",
        });
      }

      // Filter TA Requirements where the HOD's department is in the departmentIds array
      // or matches departmentKeys/departmentLabels
      const departmentKey = normalizeDepartmentKey(department.code || department.name);
      const departmentLabel = department.name;

      filter.$or = [
        { departmentIds: { $in: [new mongoose.Types.ObjectId(userDepartment)] } },
        { departmentKeys: { $in: [departmentKey] } },
        { departmentLabels: { $in: [departmentLabel] } },
      ];
    } else if (queryDepartment && queryDepartment !== "all") {
      // Admin filtering by query parameter
      const normalizedDepartment = normalizeDepartmentKey(queryDepartment);
      if (normalizedDepartment) {
        filter.departmentKeys = normalizedDepartment;
      }
    }

    const records = await TARequirement.find(filter)
      .sort({ roleName: 1 })
      .lean();

    const workbook = await buildTARequirementWorkbook(records);
    const fileName = `ta_requirements_${new Date()
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
      message: error.message || "Unable to export TA requirements sheet.",
    });
  }
}

module.exports = {
  listTARequirements,
  createTARequirement,
  updateTARequirement,
  deleteTARequirement,
  syncTARequirements,
  exportTARequirementSheet,
};


