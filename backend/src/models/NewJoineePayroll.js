const mongoose = require("mongoose");

const { Schema } = mongoose;

const stringField = {
  type: String,
  trim: true,
  default: "",
};

const NewJoineePayrollSchema = new Schema(
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
    sbuClp: stringField,
    employeeName: {
      ...stringField,
      required: true,
    },
    doj: Date,
    doe: Date,
    norm: stringField,
    designation: stringField,
    topDepartment: stringField,
    type: stringField,
    sourceDepartment: stringField,
    beneficiaryDepartment: stringField,
    sourceHod: stringField,
    beneficiaryHod: stringField,
    workMode: stringField,
    workLocation: stringField,
    employmentType: stringField,
    remarks: stringField,
    ctcRange: stringField,
    experienceRange: stringField,
    newType: stringField,
    replacementEmployeeName: stringField,
    productOrDomain: stringField,
    clh: stringField,
    assetRequirement: stringField,
    processor: stringField,
    operatingSystem: stringField,
    storage: stringField,
    ram: stringField,
    displaySize: stringField,
    graphicCard: stringField,
    peripherals: stringField,
    headPhone: stringField,
    mobilePhone: stringField,
    scienceSbu: stringField,
    budgetAmount: stringField,
    hiringStatus: stringField,
    academy: stringField,
    intensive: stringField,
    niatBatch1: stringField,
    niatBatch2: stringField,
    niatBatch3: stringField,
    others: stringField,
    common: {
      ...stringField,
      alias: "comments",
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

NewJoineePayrollSchema.index(
  { department: 1, employeeName: 1, doj: 1 },
  { name: "dept_employee_join_index" }
);

const NewJoineePayroll = mongoose.model(
  "NewJoineePayroll",
  NewJoineePayrollSchema
);

module.exports = { NewJoineePayroll };

