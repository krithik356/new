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
    designationHistory: {
      type: Map,
      of: String,
      default: {},
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    salary: {
      type: Number,
      min: 0,
      default: function defaultSalary() {
        const min = 35000;
        const max = 120000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
    },
  },
  {
    timestamps: true,
  }
);

EmployeeSchema.index({ department: 1 });

const Employee = mongoose.model("Employee", EmployeeSchema);

module.exports = { Employee };
