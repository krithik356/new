const mongoose = require("mongoose");
const { NewJoineePayroll } = require("../models/NewJoineePayroll");
const { TARequirement } = require("../models/TARequirement");

const { Types } = mongoose;

const MONTH_FIELD_MAP = {
  0: "januaryPositions",
  1: "februaryPositions",
  2: "marchPositions",
};

const normalizeText = (value) =>
  value === null || value === undefined ? "" : value.toString().trim();

const normalizeRoleName = (value) => normalizeText(value).toLowerCase();

const normalizeDepartmentKey = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

const uniqueValues = (values = []) => {
  const set = new Set();
  values.forEach((value) => {
    const normalized = normalizeText(value);
    if (normalized) {
      set.add(normalized);
    }
  });
  return Array.from(set);
};

const joinValues = (values = []) => uniqueValues(values).join(", ");

const parseCTCRange = (ctcRangeString) => {
  if (!ctcRangeString || typeof ctcRangeString !== 'string') {
    return { min: null, max: null };
  }

  // Extract all numbers from the string (handles formats like "4–6 LPA", "6-9 LPA", "10–14 LPA", etc.)
  const numbers = ctcRangeString.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) {
    return { min: null, max: null };
  }

  // Convert to numbers and filter out invalid values
  const numericValues = numbers
    .map((n) => parseFloat(n))
    .filter((n) => !Number.isNaN(n));

  if (numericValues.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
  };
};

const calculateCTCRangeMinMax = (records = []) => {
  const allMins = [];
  const allMaxs = [];

  records.forEach((record) => {
    if (!record?.ctcRange) return;
    const parsed = parseCTCRange(record.ctcRange);
    if (parsed.min !== null) allMins.push(parsed.min);
    if (parsed.max !== null) allMaxs.push(parsed.max);
  });

  return {
    minCTC: allMins.length > 0 ? Math.min(...allMins) : null,
    maxCTC: allMaxs.length > 0 ? Math.max(...allMaxs) : null,
  };
};

const collectKeys = (values = []) =>
  uniqueValues(values.map((value) => normalizeDepartmentKey(value))).filter(
    Boolean
  );

const collectDepartmentIds = (values = []) => {
  const unique = uniqueValues(
    values
      .map((value) => {
        if (!value) return "";
        if (typeof value === "string") {
          return value;
        }
        if (value instanceof Types.ObjectId) {
          return value.toString();
        }
        if (value?._id) {
          return value._id.toString();
        }
        return value.toString();
      })
      .filter(Boolean)
  );

  return unique
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
};

const countMonthlyPositions = (records = []) => {
  const counts = {
    januaryPositions: 0,
    februaryPositions: 0,
    marchPositions: 0,
  };

  records.forEach((record) => {
    if (!record?.doj) {
      return;
    }

    const date = new Date(record.doj);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const monthField = MONTH_FIELD_MAP[date.getMonth()];
    if (monthField) {
      counts[monthField] += 1;
    }
  });

  return counts;
};

const aggregateRoleRecords = (roleName, records = []) => {
  const monthlyCounts = countMonthlyPositions(records);
  const noOfPositions =
    monthlyCounts.januaryPositions +
    monthlyCounts.februaryPositions +
    monthlyCounts.marchPositions;

  const departmentLabels = uniqueValues(
    records.map((record) => record.departmentLabel || record.departmentKey)
  );
  const departmentKeys = collectKeys(
    records.map((record) => record.departmentKey || record.departmentLabel)
  );
  const departmentIds = collectDepartmentIds(records.map((record) => record.department));

  const sourceDepartments = uniqueValues(
    records.map((record) => record.sourceDepartment)
  );
  const beneficiaryDepartments = uniqueValues(
    records.map((record) => record.beneficiaryDepartment)
  );

  const ctcRangeMinMax = calculateCTCRangeMinMax(records);

  return {
    roleName,
    roleNameNormalized: normalizeRoleName(roleName),
    hodName: joinValues(
      records.map((record) => record.beneficiaryHod || record.sourceHod)
    ),
    hiringManagerName: joinValues(records.map((record) => record.sourceHod)),
    ...monthlyCounts,
    noOfPositions,
    ctcRange: joinValues(records.map((record) => record.ctcRange)),
    minCTC: ctcRangeMinMax.minCTC ?? 0,
    maxCTC: ctcRangeMinMax.maxCTC ?? 0,
    workLocation: joinValues(records.map((record) => record.workLocation)),
    employmentType: joinValues(records.map((record) => record.employmentType)),
    employmentTypeRemarks: joinValues(records.map((record) => record.remarks)),
    topDepartment: joinValues(records.map((record) => record.topDepartment)),
    department: joinValues(
      records.map((record) => record.departmentLabel || record.departmentKey)
    ),
    departmentKeys,
    departmentLabels,
    departmentIds,
    sourceDepartment: joinValues(sourceDepartments),
    sourceDepartmentKeys: collectKeys(sourceDepartments),
    beneficiaryDepartment: joinValues(beneficiaryDepartments),
    beneficiaryDepartmentKeys: collectKeys(beneficiaryDepartments),
    experienceRange: joinValues(
      records.map((record) => record.experienceRange)
    ),
    hireType: joinValues(
      records.map((record) => record.newType || record.type)
    ),
    hiringStatus: joinValues(
      records.map((record) => record.hiringStatus)
    ),
    replacementEmployeeName: joinValues(
      records.map((record) => record.replacementEmployeeName)
    ),
    productWorkingOn: joinValues(
      records.map((record) => record.productOrDomain)
    ),
    jdLink: joinValues(records.map((record) => record.jdLink)),
    assetToProvide: joinValues(
      records.map((record) => record.assetRequirement)
    ),
    processor: joinValues(records.map((record) => record.processor)),
    operatingSystem: joinValues(records.map((record) => record.operatingSystem)),
    storage: joinValues(records.map((record) => record.storage)),
    ram: joinValues(records.map((record) => record.ram)),
    displaySize: joinValues(records.map((record) => record.displaySize)),
    graphicCard: joinValues(records.map((record) => record.graphicCard)),
    peripherals: joinValues(records.map((record) => record.peripherals)),
    ipad: joinValues(records.map((record) => record.ipad)),
    headphones: joinValues(records.map((record) => record.headPhone)),
    mobilePhones: joinValues(records.map((record) => record.mobilePhone)),
    externalSsds: joinValues(records.map((record) => record.externalSsds)),
    budgetAmount: joinValues(records.map((record) => record.budgetAmount)),
  };
};

const aggregateTaRequirements = (records = []) => {
  const grouped = new Map();

  records.forEach((record) => {
    const roleName = normalizeText(record?.designation);
    if (!roleName) {
      return;
    }

    const normalizedRole = normalizeRoleName(roleName);
    if (!grouped.has(normalizedRole)) {
      grouped.set(normalizedRole, {
        roleName,
        records: [],
      });
    }

    const bucket = grouped.get(normalizedRole);
    if (!bucket.roleName && roleName) {
      bucket.roleName = roleName;
    }
    bucket.records.push(record);
  });

  return Array.from(grouped.values()).map(({ roleName, records: roleRecords }) =>
    aggregateRoleRecords(roleName, roleRecords)
  );
};

const syncTARequirementsForRoles = async (roleNames = []) => {
  const uniqueRoleNames = Array.from(
    new Set(
      roleNames
        .map((role) => normalizeText(role))
        .filter((role) => role.length > 0)
    )
  );

  const escapeRegExp = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const filter = uniqueRoleNames.length
    ? {
        $or: uniqueRoleNames.map((role) => ({
          designation: new RegExp(`^${escapeRegExp(role)}$`, "i"),
        })),
      }
    : {};

  const records = await NewJoineePayroll.find(filter).lean();

  if (records.length === 0) {
    if (uniqueRoleNames.length === 0) {
      await TARequirement.deleteMany({});
    } else {
      const normalizedTargets = uniqueRoleNames.map((role) =>
        normalizeRoleName(role)
      );
      await TARequirement.deleteMany({
        roleNameNormalized: { $in: normalizedTargets },
      });
    }
    return [];
  }

  const aggregates = aggregateTaRequirements(records);

  const results = [];
  for (const doc of aggregates) {
    const saved = await TARequirement.findOneAndUpdate(
      { roleNameNormalized: doc.roleNameNormalized },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.push(saved.toObject());
  }

  if (uniqueRoleNames.length === 0) {
    const normalized = aggregates.map((item) => item.roleNameNormalized);
    await TARequirement.deleteMany({
      roleNameNormalized: { $nin: normalized },
    });
  } else {
    const normalizedTargets = uniqueRoleNames.map((role) =>
      normalizeRoleName(role)
    );
    const normalizedFound = aggregates.map((item) => item.roleNameNormalized);
    const missing = normalizedTargets.filter(
      (role) => !normalizedFound.includes(role)
    );
    if (missing.length) {
      await TARequirement.deleteMany({
        roleNameNormalized: { $in: missing },
      });
    }
  }

  return results;
};

const syncAllTARequirements = async () => syncTARequirementsForRoles([]);

module.exports = {
  aggregateTaRequirements,
  aggregateRoleRecords,
  syncTARequirementsForRoles,
  syncAllTARequirements,
  normalizeDepartmentKey,
  normalizeRoleName,
};


