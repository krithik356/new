const mongoose = require("mongoose");

const { Schema } = mongoose;

const NonPayrollSpendSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    contractorSpend: {
      type: Number,
      min: 0,
      default: 0,
    },
    vendorSpend: {
      type: Number,
      min: 0,
      default: 0,
    },
    internSpend: {
      type: Number,
      min: 0,
      default: 0,
    },
    efficiencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

NonPayrollSpendSchema.index({ department: 1, month: 1 }, { unique: true });

const NonPayrollSpend = mongoose.model(
  "NonPayrollSpend",
  NonPayrollSpendSchema
);

module.exports = { NonPayrollSpend };

