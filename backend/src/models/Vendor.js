const mongoose = require("mongoose");

const { Schema } = mongoose;

const VendorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      required: true,
    },
    departmentsUsing: [
      {
        type: Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    monthlyCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    deliverables: {
      type: String,
      trim: true,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    contractStart: {
      type: Date,
    },
    contractEnd: {
      type: Date,
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dependencyLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    issuesLogged: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

VendorSchema.index({ category: 1 });
VendorSchema.index({ riskLevel: 1 });

const Vendor = mongoose.model("Vendor", VendorSchema);

module.exports = { Vendor };

