const mongoose = require("mongoose");

const { Schema } = mongoose;

const EmployeeSchema = new Schema(
  {
    empId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    designation: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

EmployeeSchema.index({ department: 1 });

const Employee = mongoose.model("Employee", EmployeeSchema);

module.exports = { Employee };
