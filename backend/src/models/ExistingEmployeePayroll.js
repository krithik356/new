const mongoose = require("mongoose");

const { Schema } = mongoose;

const stringField = {
  type: String,
  trim: true,
  default: "",
};

const ExistingEmployeePayrollSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    departmentKey: {
      ...stringField,
      lowercase: true,
    },
    departmentLabel: stringField,
    empId: stringField,
    empName: {
      ...stringField,
      required: true,
    },
    doj: Date,
    doe: Date,
    month: stringField,
    designation: stringField,
    topDepartment: stringField,
    type: stringField,
    sourceDepartment: stringField,
    beneficiaryDepartment: stringField,
    sourceHod: stringField,
    beneficiaryHod: stringField,
    workMode: stringField,
    employeeType: stringField,
    universityDetails: stringField,
    location: stringField,
    academy: stringField,
    intensive: stringField,
    niatBatch12: stringField,
    niatBatch3: stringField,
    niatBatch4: stringField,
    others: stringField,
    common: stringField,
    amount: stringField,
    uploadOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ExistingEmployeePayrollSchema.index(
  { department: 1, empName: 1, doj: 1 },
  { name: "existing_employee_index" }
);

// Index for finding records by empId and month (for upload deduplication)
ExistingEmployeePayrollSchema.index(
  { empId: 1, month: 1 },
  { name: "empId_month_index" }
);

// Index for search by employee name (case-insensitive search optimization)
ExistingEmployeePayrollSchema.index(
  { empName: 1 },
  { name: "empName_index" }
);

// Index for sourceDepartment filtering (HOD filtering)
ExistingEmployeePayrollSchema.index(
  { sourceDepartment: 1 },
  { name: "sourceDepartment_index" }
);

// Index for sorting by uploadOrder
ExistingEmployeePayrollSchema.index(
  { uploadOrder: 1 },
  { name: "uploadOrder_index" }
);

// Compound index for common query patterns
ExistingEmployeePayrollSchema.index(
  { department: 1, uploadOrder: 1 },
  { name: "department_uploadOrder_index" }
);

const ExistingEmployeePayroll = mongoose.model(
  "ExistingEmployeePayroll",
  ExistingEmployeePayrollSchema
);

module.exports = { ExistingEmployeePayroll };
