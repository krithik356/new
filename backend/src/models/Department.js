const mongoose = require("mongoose");

const { Schema } = mongoose;

const DepartmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    hod: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    employeesCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model("Department", DepartmentSchema);

module.exports = { Department };
