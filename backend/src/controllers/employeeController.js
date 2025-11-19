const mongoose = require("mongoose");
const { Employee } = require("../models/Employee");
const { Department } = require("../models/Department");

const SALARY_MIN = 35000;
const SALARY_MAX = 120000;

function generateRandomSalary() {
  return Math.floor(Math.random() * (SALARY_MAX - SALARY_MIN + 1)) + SALARY_MIN;
}

async function listEmployees(req, res, next) {
  try {
    const { department: departmentId } = req.query;
    const filter = {};

    if (departmentId) {
      if (!mongoose.isValidObjectId(departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department id.",
        });
      }

      if (
        req.user.role === "HOD" &&
        req.user.department &&
        String(req.user.department) !== String(departmentId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only view employees in your department.",
        });
      }

      filter.department = departmentId;
    } else if (req.user.role === "HOD") {
      if (!req.user.department) {
        return res.json({
          success: true,
          data: [],
          message:
            "You must be assigned to a department to view employees. Please contact an administrator to assign your department.",
        });
      }

      filter.$or = [
        { department: req.user.department },
        { currentDepartment: req.user.department },
      ];
    }

    const employees = await Employee.find(filter)
      .populate("department", "name code")
      .populate("currentDepartment", "name code")
      .sort({ "department.name": 1, name: 1 })
      .lean();

    return res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    return next(error);
  }
}

async function seedEmployees(req, res, next) {
  try {
    const { employees = [] } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide an array of employees to seed.",
      });
    }

    const docs = [];

    for (const employee of employees) {
      if (!employee.empId || !employee.name || !employee.department) {
        return res.status(400).json({
          success: false,
          message:
            "Each employee must include empId, name, and department identifiers.",
        });
      }

      if (!mongoose.isValidObjectId(employee.department)) {
        return res.status(400).json({
          success: false,
          message: `Invalid department id for employee ${employee.empId}.`,
        });
      }

      const departmentDoc = await Department.findById(employee.department)
        .select("name")
        .lean();
      if (!departmentDoc) {
        return res.status(400).json({
          success: false,
          message: `Department not found for employee ${employee.empId}.`,
        });
      }

      let currentDepartmentId = employee.currentDepartment || employee.department;
      if (!mongoose.isValidObjectId(currentDepartmentId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid current department id for employee ${employee.empId}.`,
        });
      }

      let currentDepartmentDoc = departmentDoc;
      if (String(currentDepartmentId) !== String(employee.department)) {
        currentDepartmentDoc = await Department.findById(currentDepartmentId)
          .select("name")
          .lean();

        if (!currentDepartmentDoc) {
          return res.status(400).json({
            success: false,
            message: `Current department not found for employee ${employee.empId}.`,
          });
        }
      }

      docs.push({
        empId: employee.empId,
        name: employee.name,
        department: employee.department,
        currentDepartment: currentDepartmentId,
        sourceDepartmentName: departmentDoc.name,
        beneficiaryDepartmentName: currentDepartmentDoc?.name ?? departmentDoc.name,
        designation: employee.designation,
        email: employee.email,
        salary:
          typeof employee.salary === "number" && employee.salary >= 0
            ? employee.salary
            : generateRandomSalary(),
      });
    }

    const created = await Employee.insertMany(docs, { ordered: false });

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate employee records detected.",
        details: error.keyValue,
      });
    }
    return next(error);
  }
}

module.exports = { listEmployees, seedEmployees };
