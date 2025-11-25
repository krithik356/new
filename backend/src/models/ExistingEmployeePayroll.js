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
    academy: stringField,
    intensive: stringField,
    niatBatch12: stringField,
    niatBatch3: stringField,
    niatBatch4: stringField,
    others: stringField,
    common: stringField,
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

const ExistingEmployeePayroll = mongoose.model(
  "ExistingEmployeePayroll",
  ExistingEmployeePayrollSchema
);

module.exports = { ExistingEmployeePayroll };


