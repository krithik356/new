const mongoose = require("mongoose");

const { Schema } = mongoose;

const ContractorSchema = new Schema(
  {
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
    role: {
      type: String,
      trim: true,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    monthlyCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    hoursWorked: {
      type: Number,
      min: 0,
      default: 0,
    },
    outputDelivered: {
      type: Number,
      min: 0,
      default: 0,
    },
    efficiencyScore: {
      type: Number,
      min: 0,
      default: 0,
    },
    contractStart: {
      type: Date,
    },
    contractEnd: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "terminated"],
      default: "active",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    deliverablesCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ContractorSchema.index({ department: 1 });
ContractorSchema.index({ efficiencyScore: -1 });

const Contractor = mongoose.model("Contractor", ContractorSchema);

module.exports = { Contractor };

