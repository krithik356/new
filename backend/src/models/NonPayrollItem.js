const mongoose = require("mongoose");

const { Schema } = mongoose;

const NonPayrollItemSchema = new Schema(
  {
    uniqueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    responsibleDepartment: {
      type: String,
      required: true,
      trim: true,
    },
    beneficiaryDepartment: {
      type: String,
      required: true,
      trim: true,
    },
    responsibleDepartmentHod: {
      type: String,
      required: true,
      trim: true,
    },
    beneficiaryDepartmentHod: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    vendor: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: String,
      required: true,
      trim: true,
    },
    serviceStartDate: {
      type: Date,
      default: null,
    },
    serviceEndDate: {
      type: Date,
      default: null,
    },
    serviceDurationDays: {
      type: Number,
      default: null,
    },
    budgetedPaymentAmountExcGst: {
      type: Number,
      required: true,
      min: 0,
    },
    gstAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    budgetedPaymentAmountInclGst: {
      type: Number,
      default: null,
    },
    dueMonthForPayment: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

NonPayrollItemSchema.index({ uniqueId: 1 }, { unique: true });

const NonPayrollItem = mongoose.model("NonPayrollItem", NonPayrollItemSchema);

module.exports = { NonPayrollItem };


