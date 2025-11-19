const mongoose = require("mongoose");

const { Schema } = mongoose;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MonthlySalarySchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    month: {
      type: String,
      enum: MONTHS,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

MonthlySalarySchema.index(
  { employee: 1, month: 1, year: 1 },
  { unique: true, name: "employee_month_year_unique" }
);

const MonthlySalary = mongoose.model("MonthlySalary", MonthlySalarySchema);

module.exports = { MonthlySalary, MONTHS };
