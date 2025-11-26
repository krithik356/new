const mongoose = require("mongoose");

const { Schema } = mongoose;

const InternSchema = new Schema(
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
    stipend: {
      type: Number,
      min: 0,
      default: 0,
    },
    mentor: {
      type: String,
      trim: true,
    },
    tasksCompleted: {
      type: Number,
      min: 0,
      default: 0,
    },
    performanceRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    productAssigned: {
      type: String,
      enum: ["Academy", "Intensive", "NIAT"],
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

InternSchema.index({ department: 1 });
InternSchema.index({ productAssigned: 1 });

const Intern = mongoose.model("Intern", InternSchema);

module.exports = { Intern };

