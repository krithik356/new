const mongoose = require("mongoose");
const { Schema } = mongoose;
const { Department } = require("./Department");

const EmployeeSchema = new Schema(
  {
    empId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    currentDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: function resolveCurrentDepartment() {
        return this.department;
      },
    },
    sourceDepartmentName: {
      type: String,
      trim: true,
    },
    beneficiaryDepartmentName: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    salary: {
      type: Number,
      min: 0,
      default: function defaultSalary() {
        const min = 35000;
        const max = 120000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
    },
  },
  {
    timestamps: true,
  }
);

async function assignDepartmentNames(doc) {
  if (!doc) {
    return;
  }

  if (!doc.currentDepartment) {
    doc.currentDepartment = doc.department;
  }

  const needsSourceName =
    !doc.sourceDepartmentName ||
    (typeof doc.isModified === "function" && doc.isModified("department"));
  const needsBeneficiaryName =
    !doc.beneficiaryDepartmentName ||
    (typeof doc.isModified === "function" &&
      doc.isModified("currentDepartment"));

  const idsToFetch = new Set();

  if (needsSourceName && doc.department) {
    idsToFetch.add(String(doc.department));
  }

  const currentDeptId = doc.currentDepartment || doc.department;
  if (needsBeneficiaryName && currentDeptId) {
    idsToFetch.add(String(currentDeptId));
  }

  if (idsToFetch.size === 0) {
    return;
  }

  const departments = await Department.find({
    _id: { $in: Array.from(idsToFetch) },
  })
    .select("name")
    .lean();

  const nameMap = new Map(
    departments.map((dept) => [String(dept._id), dept.name])
  );

  if (needsSourceName && doc.department) {
    doc.sourceDepartmentName =
      nameMap.get(String(doc.department)) ?? doc.sourceDepartmentName ?? null;
  }

  const resolvedCurrentId = currentDeptId ? String(currentDeptId) : null;

  if (needsBeneficiaryName && resolvedCurrentId) {
    doc.beneficiaryDepartmentName =
      nameMap.get(resolvedCurrentId) ??
      doc.beneficiaryDepartmentName ??
      doc.sourceDepartmentName ??
      null;
  }
}

EmployeeSchema.pre("save", async function ensureDepartmentDetails(next) {
  try {
    await assignDepartmentNames(this);
    next();
  } catch (error) {
    next(error);
  }
});

EmployeeSchema.pre("insertMany", async function ensureBulkDepartmentDetails(
  next,
  docs
) {
  try {
    if (!Array.isArray(docs) || docs.length === 0) {
      return next();
    }

    const ids = new Set();
    docs.forEach((doc) => {
      if (!doc.currentDepartment) {
        doc.currentDepartment = doc.department;
      }
      if (doc.department) {
        ids.add(String(doc.department));
      }
      if (doc.currentDepartment) {
        ids.add(String(doc.currentDepartment));
      }
    });

    if (ids.size === 0) {
      return next();
    }

    const departments = await Department.find({
      _id: { $in: Array.from(ids) },
    })
      .select("name")
      .lean();

    const nameMap = new Map(
      departments.map((dept) => [String(dept._id), dept.name])
    );

    docs.forEach((doc) => {
      const sourceId = doc.department ? String(doc.department) : null;
      const beneficiaryId = doc.currentDepartment
        ? String(doc.currentDepartment)
        : sourceId;

      if (sourceId) {
        doc.sourceDepartmentName =
          doc.sourceDepartmentName ?? nameMap.get(sourceId) ?? null;
      }

      if (beneficiaryId) {
        doc.beneficiaryDepartmentName =
          doc.beneficiaryDepartmentName ??
          nameMap.get(beneficiaryId) ??
          doc.sourceDepartmentName ??
          null;
      }
    });

    next();
  } catch (error) {
    next(error);
  }
});

EmployeeSchema.index({ department: 1 });

const Employee = mongoose.model("Employee", EmployeeSchema);

module.exports = { Employee };
