const mongoose = require("mongoose");
const { MonthlySalary, MONTHS } = require("../models/MonthlySalary");
const { Employee } = require("../models/Employee");

function getDefaultYear() {
  return new Date().getFullYear();
}

async function listMonthlySalaries(req, res, next) {
  try {
    const { month, year, departmentId } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required.",
      });
    }

    if (!MONTHS.includes(month)) {
      return res.status(400).json({
        success: false,
        message: `Invalid month. Supported months: ${MONTHS.join(", ")}`,
      });
    }

    const yearNum = year ? parseInt(year, 10) : getDefaultYear();
    if (Number.isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: "Year must be between 2000 and 2100.",
      });
    }

    const employeeFilter = {};

  if (departmentId && departmentId !== "all") {
      if (!mongoose.isValidObjectId(departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID.",
        });
      }
      employeeFilter.department = departmentId;
    } else if (req.user.role === "HOD") {
      if (!req.user.department) {
        // Gracefully return empty data if HOD has no department mapping
        return res.json({
          success: true,
          data: [],
          message:
            "Department mapping missing for current HOD. No monthly salaries to display.",
        });
      }
      employeeFilter.department = req.user.department;
    }

    const employees = await Employee.find(employeeFilter)
      .populate("department", "name code")
      .sort({ name: 1 })
      .lean();

    if (employees.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const employeeIds = employees.map((emp) => emp._id);

    const salaryRecords = await MonthlySalary.find({
      employee: { $in: employeeIds },
      month,
      year: yearNum,
    })
      .select("employee amount month year")
      .lean();

    const salaryMap = salaryRecords.reduce((map, record) => {
      map.set(record.employee.toString(), record.amount);
      return map;
    }, new Map());

    const data = employees.map((emp) => {
      const key = emp._id.toString();
      const storedAmount = salaryMap.get(key);
      const fallbackAmount = Math.round(((emp.salary || 0) / 12) || 0);

      return {
        employee: {
          id: emp._id,
          name: emp.name,
          empId: emp.empId,
          designation: emp.designation,
          email: emp.email,
          salary: emp.salary,
          department: emp.department,
        },
        month,
        year: yearNum,
        amount: typeof storedAmount === "number" ? storedAmount : fallbackAmount,
        source: typeof storedAmount === "number" ? "stored" : "derived",
      };
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listMonthlySalaries,
};
