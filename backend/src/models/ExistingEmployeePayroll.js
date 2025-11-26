const mongoose = require("mongoose");

const { Schema } = mongoose;

const ExistingEmployeePayrollSchema = new Schema(
  {
    empId: {
      type: String,
      required: true,
      trim: true,
    },
    empName: {
      type: String,
      required: true,
      trim: true,
    },
    doj: {
      type: Date,
      required: true,
    },
    doe: {
      type: Date,
      default: null,
    },
    month: {
      type: Date,
      required: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    topDepartment: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    sourceDepartment: {
      type: String,
      trim: true,
    },
    beneficiaryDepartment: {
      type: String,
      trim: true,
    },
    sourceHod: {
      type: String,
      trim: true,
    },
    beneficiaryHod: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    wfoWfh: {
      type: String,
      trim: true,
    },
    employeeType: {
      type: String,
      trim: true,
    },
    academy: {
      type: Number,
      default: null,
      min: 0,
    },
    intensive: {
      type: Number,
      default: null,
      min: 0,
    },
    niatBatch1And2: {
      type: Number,
      default: null,
      min: 0,
    },
    niatBatch3: {
      type: Number,
      default: null,
      min: 0,
    },
    niatBatch4: {
      type: Number,
      default: null,
      min: 0,
    },
    others: {
      type: Number,
      default: null,
      min: 0,
    },
    common: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  { timestamps: true }
);

ExistingEmployeePayrollSchema.index({ empId: 1, month: 1 });
ExistingEmployeePayrollSchema.index({ department: 1, month: 1 });

const ExistingEmployeePayroll = mongoose.model(
  "ExistingEmployeePayroll",
  ExistingEmployeePayrollSchema
);

module.exports = { ExistingEmployeePayroll };

