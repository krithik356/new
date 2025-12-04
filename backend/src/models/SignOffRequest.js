const mongoose = require("mongoose");

const { Schema } = mongoose;

const SignOffRequestSchema = new Schema(
  {
    // Reference to the existing employee payroll record
    payrollRecord: {
      type: Schema.Types.ObjectId,
      ref: "ExistingEmployeePayroll",
      required: true,
      index: true,
    },
    // Status of the sign-off request
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
      index: true,
    },
    // Target department (HOD's department) for the sign-off
    targetDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    // User who requested the sign-off
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // User who decided on the sign-off (HOD)
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Remark/comment when rejected
    remark: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
SignOffRequestSchema.index(
  { targetDepartment: 1, status: 1 },
  { name: "signoff_target_status_index" }
);

SignOffRequestSchema.index(
  { payrollRecord: 1, status: 1 },
  { name: "signoff_payroll_status_index" }
);

const SignOffRequest = mongoose.model("SignOffRequest", SignOffRequestSchema);

module.exports = { SignOffRequest };

