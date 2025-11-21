const mongoose = require("mongoose");

const { Schema } = mongoose;

const ContractRiskSchema = new Schema(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["contractor", "vendor"],
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    complianceIssue: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

ContractRiskSchema.index({ department: 1, riskLevel: -1 });
ContractRiskSchema.index({ resourceId: 1, resourceType: 1 });

const ContractRisk = mongoose.model("ContractRisk", ContractRiskSchema);

module.exports = { ContractRisk };

