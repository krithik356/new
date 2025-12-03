const mongoose = require("mongoose");

const { Schema } = mongoose;

const stringField = {
  type: String,
  trim: true,
  default: "",
};

const numberField = {
  type: Number,
  default: 0,
};

const TARequirementSchema = new Schema(
  {
    roleName: {
      ...stringField,
      required: true,
    },
    roleNameNormalized: {
      ...stringField,
      required: true,
      lowercase: true,
    },
    hodName: stringField,
    hiringManagerName: stringField,
    noOfPositions: numberField,
    januaryPositions: numberField,
    februaryPositions: numberField,
    marchPositions: numberField,
    ctcRange: stringField,
    minCTC: numberField,
    maxCTC: numberField,
    workLocation: stringField,
    employmentType: stringField,
    employmentTypeRemarks: stringField,
    topDepartment: stringField,
    department: stringField,
    departmentKeys: {
      type: [String],
      default: [],
    },
    departmentLabels: {
      type: [String],
      default: [],
    },
    departmentIds: {
      type: [Schema.Types.ObjectId],
      ref: "Department",
      default: [],
    },
    sourceDepartment: stringField,
    sourceDepartmentKeys: {
      type: [String],
      default: [],
    },
    beneficiaryDepartment: stringField,
    beneficiaryDepartmentKeys: {
      type: [String],
      default: [],
    },
    experienceRange: stringField,
    hireType: stringField,
    hiringStatus: stringField,
    replacementEmployeeName: stringField,
    productWorkingOn: stringField,
    jdLink: stringField,
    assetToProvide: stringField,
    processor: stringField,
    operatingSystem: stringField,
    storage: stringField,
    ram: stringField,
    displaySize: stringField,
    graphicCard: stringField,
    peripherals: stringField,
    ipad: stringField,
    headphones: stringField,
    mobilePhones: stringField,
    externalSsds: stringField,
    budgetAmount: stringField,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TARequirementSchema.index(
  { roleNameNormalized: 1 },
  { unique: true, name: "role_name_unique_index" }
);

const TARequirement = mongoose.model("TARequirement", TARequirementSchema);

module.exports = { TARequirement };


