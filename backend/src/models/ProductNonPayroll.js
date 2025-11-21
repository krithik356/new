const mongoose = require("mongoose");

const { Schema } = mongoose;

const DepartmentBreakdownSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    contractorCosts: {
      type: Number,
      min: 0,
      default: 0,
    },
    vendorCosts: {
      type: Number,
      min: 0,
      default: 0,
    },
    internCosts: {
      type: Number,
      min: 0,
      default: 0,
    },
    outputScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const ProductNonPayrollSchema = new Schema(
  {
    productName: {
      type: String,
      enum: ["Academy", "Intensive", "NIAT"],
      unique: true,
      required: true,
    },
    contractorCosts: {
      type: Number,
      min: 0,
      default: 0,
    },
    vendorCosts: {
      type: Number,
      min: 0,
      default: 0,
    },
    internCosts: {
      type: Number,
      min: 0,
      default: 0,
    },
    outputScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    departmentBreakdown: {
      type: [DepartmentBreakdownSchema],
      default: [],
    },
  },
  { timestamps: true }
);

ProductNonPayrollSchema.index({ productName: 1 });

const ProductNonPayroll = mongoose.model(
  "ProductNonPayroll",
  ProductNonPayrollSchema
);

module.exports = { ProductNonPayroll };

