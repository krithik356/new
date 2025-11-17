const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { User } = require("../models/User");
const { signToken } = require("../config/jwt");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Normalize email to lowercase (matching User model schema)
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).populate(
      "department",
      "name code"
    );

    if (!user) {
      // Log for debugging (remove in production if needed)
      console.log(`[Login] User not found for email: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const passwordMatch = await user.comparePassword(password);

    if (!passwordMatch) {
      // Log for debugging (remove in production if needed)
      console.log(`[Login] Password mismatch for user: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Ensure role is exactly "Admin" or "HOD" (case-sensitive)
    const userRole = user.role === "Admin" ? "Admin" : user.role === "HOD" ? "HOD" : user.role;

    const token = signToken({
      id: user.id,
      role: userRole,
      department: user.department ? user.department._id : null,
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: userRole,
          department: user.department
            ? {
                id: user.department.id,
                name: user.department.name,
                code: user.department.code,
              }
            : null,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already in use.",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      department: role === "HOD" ? department : null,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function signup(req, res, next) {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const validRole = role === "Admin" ? "Admin" : "HOD";

    if (validRole === "HOD" && !department) {
      return res.status(400).json({
        success: false,
        message: "Department is required for HOD role.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already in use.",
      });
    }

    // Validate department exists if provided
    if (department) {
      const mongoose = require("mongoose");
      if (!mongoose.isValidObjectId(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID.",
        });
      }
      const { Department } = require("../models/Department");
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(404).json({
          success: false,
          message: "Department not found.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Ensure department is properly saved for HOD
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: validRole,
      department: validRole === "HOD" && department ? department : null,
    });

    // Populate department for response
    const populatedUser = await User.findById(user.id).populate("department", "name code");

    // Verify department was saved correctly
    if (validRole === "HOD" && department && !populatedUser.department) {
      console.error("Warning: Department not found after creation", {
        userId: user.id,
        departmentId: department,
      });
    }

    const token = signToken({
      id: populatedUser.id,
      role: populatedUser.role,
      department: populatedUser.department ? populatedUser.department._id.toString() : null,
    });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: populatedUser.id,
          name: populatedUser.name,
          email: populatedUser.email,
          role: populatedUser.role,
          department: populatedUser.department
            ? {
                id: populatedUser.department._id.toString(),
                name: populatedUser.department.name,
                code: populatedUser.department.code,
              }
            : null,
        },
      },
      message: validRole === "HOD" && populatedUser.department
        ? `Account created successfully. You are assigned to ${populatedUser.department.name}${populatedUser.department.code ? ` (${populatedUser.department.code})` : ''}. You can now manage your department's contributions.`
        : validRole === "HOD"
        ? "Account created successfully. You can now manage your department's contributions."
        : "Account created successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUserDepartment(req, res, next) {
  try {
    const { userId } = req.params;
    const { department } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Only allow updating department for HOD users
    if (user.role !== "HOD") {
      return res.status(400).json({
        success: false,
        message: "Department can only be assigned to HOD users.",
      });
    }

    // Validate department if provided
    if (department) {
      if (!mongoose.isValidObjectId(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID.",
        });
      }
      const { Department } = require("../models/Department");
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(404).json({
          success: false,
          message: "Department not found.",
        });
      }
    }

    user.department = department || null;
    await user.save();

    const populatedUser = await User.findById(user.id).populate("department", "name code");

    return res.json({
      success: true,
      data: {
        id: populatedUser.id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        department: populatedUser.department
          ? {
              id: populatedUser.department.id,
              name: populatedUser.department.name,
              code: populatedUser.department.code,
            }
          : null,
      },
      message: department
        ? "Department assigned successfully."
        : "Department removed successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, createUser, signup, updateUserDepartment };
