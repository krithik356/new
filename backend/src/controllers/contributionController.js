const mongoose = require("mongoose");
const { Contribution } = require("../models/Contribution");
const { Department } = require("../models/Department");
const { validateContributionPayload } = require("../utils/validators");

const DEFAULT_YEAR = Number(process.env.DEFAULT_CONTRIBUTION_YEAR || 2025);

function normalizeYear(yearValue) {
  if (yearValue === undefined || yearValue === null) {
    return DEFAULT_YEAR;
  }

  const parsed = parseInt(yearValue, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_YEAR;
  }

  if (parsed < 2000 || parsed > 2100) {
    return DEFAULT_YEAR;
  }

  return parsed;
}

async function listContributions(req, res, next) {
  try {
    const { cycle, year } = req.query;
    const filter = {};

    // HOD can only see their department's contributions
    if (req.user.role === "HOD") {
      if (!req.user.department) {
        // Return empty array instead of error
        return res.json({
          success: true,
          data: [],
          message: "You must be assigned to a department to view contributions. Please contact an administrator to assign your department.",
        });
      }
      filter.department = req.user.department;
    }
    // Admin can see all contributions (no filter)

    if (cycle) {
      filter.cycle = cycle;
    }
    filter.year = normalizeYear(year);
    const contributions = await Contribution.find(filter)
      .populate({
        path: "department",
        select: "name code hod",
        populate: {
          path: "hod",
          select: "name email",
        },
      })
      .populate("employee", "name empId designation email")
      .populate("submittedBy", "name email role")
      .sort({ submittedAt: -1 });

    return res.json({
      success: true,
      data: contributions,
    });
  } catch (error) {
    return next(error);
  }
}

async function getContributionByDepartment(req, res, next) {
  try {
    const { departmentId } = req.params;
    const { year } = req.query;
    const targetYear = normalizeYear(year);

    if (!mongoose.isValidObjectId(departmentId)) {
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
          message: "You must be assigned to a department to view contributions. Please contact an administrator to assign your department.",
        });
      }
      
      if (String(req.user.department) !== String(departmentId)) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own department contribution.",
        });
      }
    }

    const contribution = await Contribution.findOne({
      department: departmentId,
      employee: null, // Department-level contribution
      year: targetYear,
    })
      .populate("department", "name code")
      .populate("submittedBy", "name email role");

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found for this department.",
      });
    }

    return res.json({
      success: true,
      data: contribution,
    });
  } catch (error) {
    return next(error);
  }
}

async function createContribution(req, res, next) {
  try {
    const { department, academy, intensive, niat, remarks, cycle, year } = req.body;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department is required.",
      });
    }

    if (req.user.role === "HOD" && String(req.user.department) !== department) {
      return res.status(403).json({
        success: false,
        message: "You can only submit contributions for your department.",
      });
    }

    if (!mongoose.isValidObjectId(department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department id.",
      });
    }

    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    const { ok, errors } = validateContributionPayload({
      academy,
      intensive,
      niat,
    });

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: "Contribution validation failed.",
        errors,
      });
    }

    const cycleKey = cycle || "default";
    const targetYear = normalizeYear(year);

    const existing = await Contribution.findOne({
      department,
      cycle: cycleKey,
      year: targetYear,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "Contribution for this department and cycle already exists. Use the update endpoint instead.",
        data: existing,
      });
    }

    const contribution = await Contribution.create({
      department,
      academy,
      intensive,
      niat,
      remarks,
      cycle: cycleKey,
      year: targetYear,
      submittedBy: req.user.id,
      submittedAt: new Date(),
    });

    const populated = await contribution
      .populate("department", "name code")
      .populate("submittedBy", "name email role");

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateContribution(req, res, next) {
  try {
    const { id } = req.params;
    const { academy, intensive, niat, remarks, cycle, year } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contribution id.",
      });
    }

    const contribution = await Contribution.findById(id);

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found.",
      });
    }

    if (
      req.user.role === "HOD" &&
      String(req.user.department) !== String(contribution.department)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update contributions for your department.",
      });
    }

    const payload = {
      academy: academy !== undefined ? academy : contribution.academy,
      intensive: intensive !== undefined ? intensive : contribution.intensive,
      niat: niat !== undefined ? niat : contribution.niat,
    };

    const { ok, errors } = validateContributionPayload(payload);

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: "Contribution validation failed.",
        errors,
      });
    }

    contribution.academy = payload.academy;
    contribution.intensive = payload.intensive;
    contribution.niat = payload.niat;
    contribution.remarks =
      remarks !== undefined ? remarks : contribution.remarks;
    contribution.cycle = cycle || contribution.cycle;
    contribution.year = year ? normalizeYear(year) : contribution.year || DEFAULT_YEAR;
    contribution.submittedBy = req.user.id;
    contribution.submittedAt = new Date();

    await contribution.save();

    const populated = await contribution
      .populate("department", "name code")
      .populate("submittedBy", "name email role");

    return res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteContribution(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contribution id.",
      });
    }

    const contribution = await Contribution.findById(id);

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "Contribution not found.",
      });
    }

    await Contribution.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: "Contribution deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

async function getEmployeesWithContributions(req, res, next) {
  try {
    const { cycle, year } = req.query;
    const { Employee } = require("../models/Employee");
    const { Contribution } = require("../models/Contribution");

    let departmentFilter = {};
    let contributionDepartmentFilter = {};
    
    // HOD can only see their department's employees and contributions
    if (req.user.role === "HOD") {
      if (!req.user.department) {
        // Return empty array instead of 403
        return res.json({
          success: true,
          data: [],
          message: "You must be assigned to a department to view employee contributions. Please contact an administrator to assign your department.",
        });
      }
      departmentFilter.department = req.user.department;
      contributionDepartmentFilter.department = req.user.department;
    }
    // Admin can see all employees (no filter)

    const employees = await Employee.find(departmentFilter)
      .populate("department", "name code")
      .sort({ name: 1 })
      .lean();

    const employeeIds = employees.map((emp) => emp._id);
    
    const contributionFilter = {
      employee: { $in: employeeIds },
      ...contributionDepartmentFilter, // Ensure contributions are also filtered by department for HODs
    };
    
    if (cycle) {
      contributionFilter.cycle = cycle;
    }
    contributionFilter.year = normalizeYear(year);

    const contributions = await Contribution.find(contributionFilter)
      .populate("employee", "name empId designation email")
      .populate("department", "name code")
      .populate("submittedBy", "name email")
      .sort({ cycle: -1, submittedAt: -1 })
      .lean();

    // Group contributions by employee
    const employeesWithContributions = employees.map((employee) => {
      const employeeContributions = contributions.filter(
        (contrib) => String(contrib.employee?._id) === String(employee._id)
      );
      
      return {
        ...employee,
        contributions: employeeContributions,
        totalContributions: employeeContributions.length,
      };
    });

    return res.json({
      success: true,
      data: employeesWithContributions,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listContributions,
  getContributionByDepartment,
  getEmployeesWithContributions,
  createContribution,
  updateContribution,
  deleteContribution,
};
