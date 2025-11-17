const mongoose = require("mongoose");
const { Department } = require("../models/Department");
const { User } = require("../models/User");
const { Employee } = require("../models/Employee");

async function getDepartments(req, res, next) {
  try {
    let filter = {};
    
    // HOD can only see their own department
    if (req.user.role === "HOD") {
      if (!req.user.department) {
        // Return empty array if HOD has no department
        return res.json({
          success: true,
          data: [],
          message: "You must be assigned to a department. Please contact an administrator.",
        });
      }
      filter._id = req.user.department;
    }
    // Admin: no filter, show all

    const departments = await Department.find(filter)
      .populate("hod", "name email role")
      .lean();

    return res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    return next(error);
  }
}

async function getDepartmentById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department id.",
      });
    }

    // HOD must have a department assigned
    if (req.user.role === "HOD") {
      if (!req.user.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view department details. Please contact an administrator to assign your department.",
        });
      }
      
      if (String(req.user.department) !== String(id)) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own department.",
        });
      }
    }

    const department = await Department.findById(id)
      .populate("hod", "name email role")
      .lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const employeesCount = await Employee.countDocuments({ department: id });
    department.employeesCount = employeesCount;

    return res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    return next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code, hod } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Department name is required.",
      });
    }

    const department = await Department.create({
      name,
      code,
      hod: hod || null,
    });

    if (hod) {
      await User.findByIdAndUpdate(hod, {
        department: department._id,
        role: "HOD",
      });
    }

    return res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, hod } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department id.",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    if (name) department.name = name;
    if (code !== undefined) department.code = code;
    if (hod !== undefined) department.hod = hod || null;

    await department.save();

    if (hod) {
      await User.findByIdAndUpdate(hod, {
        department: department._id,
        role: "HOD",
      });
    }

    return res.json({
      success: true,
      data: await department.populate("hod", "name email role"),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
};
