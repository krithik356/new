const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { Schema } = mongoose;

const roles = ["Admin", "HOD"];

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: roles,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      validate: {
        validator(value) {
          if (this.role === "HOD") {
            return Boolean(value);
          }
          return true;
        },
        message: "HOD users must be linked to a department.",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model("User", UserSchema);

module.exports = { User };
