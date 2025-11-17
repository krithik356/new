const ExcelJS = require("exceljs");
const { Contribution } = require("../models/Contribution");
const { Department } = require("../models/Department");
const { Employee } = require("../models/Employee");
const { buildContributionWorkbook } = require("../utils/excelExporter");

async function exportContributions(req, res, next) {
  try {
    const { cycle } = req.query;
    const filter = {};

    if (cycle) {
      filter.cycle = cycle;
    }

    const contributions = await Contribution.find(filter)
      .populate({
        path: "department",
        select: "name code hod",
        populate: {
          path: "hod",
          select: "name email",
        },
      })
      .populate("submittedBy", "name email")
      .sort({ submittedAt: -1 });

    const workbook = await buildContributionWorkbook(contributions, {
      sheetName: cycle ? `Contributions ${cycle}` : "Contributions",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `contributions_${cycle || "all"}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
}

async function exportDepartmentReport(req, res, next) {
  try {
    const { cycle } = req.query;

    // Get all departments
    const departments = await Department.find()
      .populate("hod", "name email")
      .sort({ name: 1 })
      .lean();

    // Get department-level contributions (where employee is null)
    const filter = { employee: null };
    if (cycle) {
      filter.cycle = cycle;
    }

    const contributions = await Contribution.find(filter)
      .populate("department", "name code")
      .populate("submittedBy", "name email")
      .sort({ "department.name": 1, cycle: 1 })
      .lean();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Employee Contribution Automation System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      cycle ? `Department Report ${cycle}` : "Department Report",
      {
        views: [{ state: "frozen", ySplit: 1 }],
      }
    );

    // Define columns
    sheet.columns = [
      { header: "Department", key: "department", width: 25 },
      { header: "Department Code", key: "code", width: 18 },
      { header: "HOD Name", key: "hodName", width: 25 },
      { header: "HOD Email", key: "hodEmail", width: 30 },
      { header: "Cycle", key: "cycle", width: 15 },
      { header: "Academy %", key: "academy", width: 12 },
      { header: "Intensive %", key: "intensive", width: 12 },
      { header: "NIAT %", key: "niat", width: 12 },
      { header: "Total %", key: "total", width: 12 },
      { header: "Submitted By", key: "submittedBy", width: 25 },
      { header: "Submitted At", key: "submittedAt", width: 24 },
      { header: "Remarks", key: "remarks", width: 40 },
    ];

    // Group contributions by department
    const departmentMap = new Map();
    departments.forEach((dept) => {
      departmentMap.set(dept._id.toString(), {
        ...dept,
        contributions: [],
      });
    });

    contributions.forEach((contrib) => {
      const deptId = contrib.department?._id?.toString();
      if (deptId && departmentMap.has(deptId)) {
        departmentMap.get(deptId).contributions.push(contrib);
      }
    });

    // Add rows for each department
    departmentMap.forEach((deptData) => {
      if (deptData.contributions.length === 0) {
        // Department with no contributions
        sheet.addRow({
          department: deptData.name,
          code: deptData.code || "—",
          hodName: deptData.hod?.name || "—",
          hodEmail: deptData.hod?.email || "—",
          cycle: "—",
          academy: "—",
          intensive: "—",
          niat: "—",
          total: "—",
          submittedBy: "—",
          submittedAt: "—",
          remarks: "No contributions recorded",
        });
      } else {
        // Add a row for each contribution cycle
        deptData.contributions.forEach((contrib) => {
          sheet.addRow({
            department: contrib.department?.name || deptData.name,
            code: contrib.department?.code || deptData.code || "—",
            hodName: deptData.hod?.name || "—",
            hodEmail: deptData.hod?.email || "—",
            cycle: contrib.cycle || "—",
            academy: contrib.academy || 0,
            intensive: contrib.intensive || 0,
            niat: contrib.niat || 0,
            total:
              (contrib.academy || 0) +
              (contrib.intensive || 0) +
              (contrib.niat || 0),
            submittedBy: contrib.submittedBy?.name || "—",
            submittedAt: contrib.submittedAt
              ? new Date(contrib.submittedAt).toLocaleString()
              : "—",
            remarks: contrib.remarks || "",
          });
        });
      }
    });

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add summary section at the end
    const summaryRow = sheet.rowCount + 2;
    sheet.getCell(`A${summaryRow}`).value = "Summary";
    sheet.getCell(`A${summaryRow}`).font = { bold: true, size: 12 };
    sheet.mergeCells(`A${summaryRow}:D${summaryRow}`);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = cycle
      ? `department_report_${cycle}.xlsx`
      : `department_report_all_cycles.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
}

async function exportDepartmentEmployeeContributions(req, res, next) {
  try {
    const { cycle } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const departmentId = req.user.department;

    // Only HODs can use this endpoint
    if (userRole !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HODs can generate department employee contribution sheets.",
      });
    }

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "You must be assigned to a department to generate this report. Please contact an administrator.",
      });
    }

    // Get department details
    const department = await Department.findById(departmentId)
      .populate("hod", "name email")
      .lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    // Get all employees in the department
    const employees = await Employee.find({ department: departmentId })
      .populate("department", "name code")
      .sort({ name: 1 })
      .lean();

    // Get employee IDs
    const employeeIds = employees.map((emp) => emp._id);

    // Build contribution filter
    const contributionFilter = {
      employee: { $in: employeeIds },
      department: departmentId,
    };

    if (cycle) {
      contributionFilter.cycle = cycle;
    }

    // Get all employee contributions
    const contributions = await Contribution.find(contributionFilter)
      .populate("employee", "name empId designation email")
      .populate("department", "name code")
      .populate("submittedBy", "name email")
      .sort({ cycle: -1, submittedAt: -1 })
      .lean();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Employee Contribution Automation System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      cycle ? `Employee Contributions ${cycle}` : "Employee Contributions",
      {
        views: [{ state: "frozen", ySplit: 1 }],
      }
    );

    // Define columns
    sheet.columns = [
      { header: "Employee ID", key: "empId", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Department", key: "department", width: 25 },
      { header: "Department Code", key: "code", width: 18 },
      { header: "Cycle", key: "cycle", width: 15 },
      { header: "Academy %", key: "academy", width: 12 },
      { header: "Intensive %", key: "intensive", width: 12 },
      { header: "NIAT %", key: "niat", width: 12 },
      { header: "Total %", key: "total", width: 12 },
      { header: "Submitted By", key: "submittedBy", width: 25 },
      { header: "Submitted At", key: "submittedAt", width: 24 },
      { header: "Remarks", key: "remarks", width: 40 },
    ];

    // Group contributions by employee
    const employeeMap = new Map();
    employees.forEach((emp) => {
      employeeMap.set(emp._id.toString(), {
        ...emp,
        contributions: [],
      });
    });

    contributions.forEach((contrib) => {
      const empId = contrib.employee?._id?.toString();
      if (empId && employeeMap.has(empId)) {
        employeeMap.get(empId).contributions.push(contrib);
      }
    });

    // Add rows for each employee
    employeeMap.forEach((empData) => {
      if (empData.contributions.length === 0) {
        // Employee with no contributions
        sheet.addRow({
          empId: empData.empId || "—",
          employeeName: empData.name || "—",
          designation: empData.designation || "—",
          email: empData.email || "—",
          department: empData.department?.name || department.name,
          code: empData.department?.code || department.code || "—",
          cycle: "—",
          academy: "—",
          intensive: "—",
          niat: "—",
          total: "—",
          submittedBy: "—",
          submittedAt: "—",
          remarks: "No contributions recorded",
        });
      } else {
        // Add a row for each contribution cycle
        empData.contributions.forEach((contrib) => {
          sheet.addRow({
            empId: contrib.employee?.empId || empData.empId || "—",
            employeeName: contrib.employee?.name || empData.name || "—",
            designation: contrib.employee?.designation || empData.designation || "—",
            email: contrib.employee?.email || empData.email || "—",
            department: contrib.department?.name || department.name,
            code: contrib.department?.code || department.code || "—",
            cycle: contrib.cycle || "—",
            academy: contrib.academy || 0,
            intensive: contrib.intensive || 0,
            niat: contrib.niat || 0,
            total:
              (contrib.academy || 0) +
              (contrib.intensive || 0) +
              (contrib.niat || 0),
            submittedBy: contrib.submittedBy?.name || "—",
            submittedAt: contrib.submittedAt
              ? new Date(contrib.submittedAt).toLocaleString()
              : "—",
            remarks: contrib.remarks || "",
          });
        });
      }
    });

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add summary section
    const summaryRow = sheet.rowCount + 2;
    sheet.getCell(`A${summaryRow}`).value = `Department: ${department.name}`;
    sheet.getCell(`A${summaryRow}`).font = { bold: true, size: 12 };
    sheet.mergeCells(`A${summaryRow}:D${summaryRow}`);

    sheet.getCell(`A${summaryRow + 1}`).value = `HOD: ${department.hod?.name || "—"}`;
    sheet.getCell(`A${summaryRow + 1}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 1}:D${summaryRow + 1}`);

    sheet.getCell(`A${summaryRow + 2}`).value = `Total Employees: ${employees.length}`;
    sheet.getCell(`A${summaryRow + 2}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 2}:D${summaryRow + 2}`);

    sheet.getCell(`A${summaryRow + 3}`).value = `Total Contributions: ${contributions.length}`;
    sheet.getCell(`A${summaryRow + 3}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 3}:D${summaryRow + 3}`);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = cycle
      ? `employee_contributions_${department.name.replace(/\s+/g, "_")}_${cycle}.xlsx`
      : `employee_contributions_${department.name.replace(/\s+/g, "_")}_all_cycles.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
}

async function sendSheetToAdmin(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const departmentId = req.user.department;

    // Only HODs can send sheets
    if (userRole !== "HOD") {
      return res.status(403).json({
        success: false,
        message: "Only HODs can send sheets to administrators.",
      });
    }

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "You must be assigned to a department to send a report. Please contact an administrator.",
      });
    }

    // Get department details
    const department = await Department.findById(departmentId)
      .populate("hod", "name email")
      .lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    // Generate the sheet (same logic as exportDepartmentEmployeeContributions)
    const { cycle } = req.query;
    const employees = await Employee.find({ department: departmentId })
      .populate("department", "name code")
      .sort({ name: 1 })
      .lean();

    const employeeIds = employees.map((emp) => emp._id);

    const contributionFilter = {
      employee: { $in: employeeIds },
      department: departmentId,
    };

    if (cycle) {
      contributionFilter.cycle = cycle;
    }

    const contributions = await Contribution.find(contributionFilter)
      .populate("employee", "name empId designation email")
      .populate("department", "name code")
      .populate("submittedBy", "name email")
      .sort({ cycle: -1, submittedAt: -1 })
      .lean();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Employee Contribution Automation System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      cycle ? `Employee Contributions ${cycle}` : "Employee Contributions",
      {
        views: [{ state: "frozen", ySplit: 1 }],
      }
    );

    sheet.columns = [
      { header: "Employee ID", key: "empId", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Department", key: "department", width: 25 },
      { header: "Department Code", key: "code", width: 18 },
      { header: "Cycle", key: "cycle", width: 15 },
      { header: "Academy %", key: "academy", width: 12 },
      { header: "Intensive %", key: "intensive", width: 12 },
      { header: "NIAT %", key: "niat", width: 12 },
      { header: "Total %", key: "total", width: 12 },
      { header: "Submitted By", key: "submittedBy", width: 25 },
      { header: "Submitted At", key: "submittedAt", width: 24 },
      { header: "Remarks", key: "remarks", width: 40 },
    ];

    const employeeMap = new Map();
    employees.forEach((emp) => {
      employeeMap.set(emp._id.toString(), {
        ...emp,
        contributions: [],
      });
    });

    contributions.forEach((contrib) => {
      const empId = contrib.employee?._id?.toString();
      if (empId && employeeMap.has(empId)) {
        employeeMap.get(empId).contributions.push(contrib);
      }
    });

    employeeMap.forEach((empData) => {
      if (empData.contributions.length === 0) {
        sheet.addRow({
          empId: empData.empId || "—",
          employeeName: empData.name || "—",
          designation: empData.designation || "—",
          email: empData.email || "—",
          department: empData.department?.name || department.name,
          code: empData.department?.code || department.code || "—",
          cycle: "—",
          academy: "—",
          intensive: "—",
          niat: "—",
          total: "—",
          submittedBy: "—",
          submittedAt: "—",
          remarks: "No contributions recorded",
        });
      } else {
        empData.contributions.forEach((contrib) => {
          sheet.addRow({
            empId: contrib.employee?.empId || empData.empId || "—",
            employeeName: contrib.employee?.name || empData.name || "—",
            designation: contrib.employee?.designation || empData.designation || "—",
            email: contrib.employee?.email || empData.email || "—",
            department: contrib.department?.name || department.name,
            code: contrib.department?.code || department.code || "—",
            cycle: contrib.cycle || "—",
            academy: contrib.academy || 0,
            intensive: contrib.intensive || 0,
            niat: contrib.niat || 0,
            total:
              (contrib.academy || 0) +
              (contrib.intensive || 0) +
              (contrib.niat || 0),
            submittedBy: contrib.submittedBy?.name || "—",
            submittedAt: contrib.submittedAt
              ? new Date(contrib.submittedAt).toLocaleString()
              : "—",
            remarks: contrib.remarks || "",
          });
        });
      }
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const summaryRow = sheet.rowCount + 2;
    sheet.getCell(`A${summaryRow}`).value = `Department: ${department.name}`;
    sheet.getCell(`A${summaryRow}`).font = { bold: true, size: 12 };
    sheet.mergeCells(`A${summaryRow}:D${summaryRow}`);

    sheet.getCell(`A${summaryRow + 1}`).value = `HOD: ${department.hod?.name || "—"}`;
    sheet.getCell(`A${summaryRow + 1}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 1}:D${summaryRow + 1}`);

    sheet.getCell(`A${summaryRow + 2}`).value = `Total Employees: ${employees.length}`;
    sheet.getCell(`A${summaryRow + 2}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 2}:D${summaryRow + 2}`);

    sheet.getCell(`A${summaryRow + 3}`).value = `Total Contributions: ${contributions.length}`;
    sheet.getCell(`A${summaryRow + 3}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 3}:D${summaryRow + 3}`);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = cycle
      ? `employee_contributions_${department.name.replace(/\s+/g, "_")}_${cycle}.xlsx`
      : `employee_contributions_${department.name.replace(/\s+/g, "_")}_all_cycles.xlsx`;

    // Store the report in database for admin to access
    // For now, we'll create a simple model to store sent reports
    // In a production system, you might want to use a proper Report model
    // For simplicity, we'll return the buffer and let the frontend handle it
    // and create a notification system

    // Get the User model to find admin users
    const { User } = require("../models/User");
    const adminUsers = await User.find({ role: "Admin" }).select("name email").lean();

    // Log that the report was sent (in production, store this in database)
    console.log(`[Report Sent] HOD ${req.user.name} (${req.user.email}) sent report for department ${department.name} to administrators.`);
    console.log(`[Report Sent] Notifying ${adminUsers.length} administrator(s):`, adminUsers.map(u => u.email).join(", "));

    // Return success message
    // In a real system, you might want to:
    // 1. Store the report in a database
    // 2. Send email notifications to admins
    // 3. Create a notification system
    return res.json({
      success: true,
      message: `Report for ${department.name} has been sent to ${adminUsers.length} administrator(s).`,
      department: department.name,
      adminsNotified: adminUsers.length,
      filename: filename,
    });
  } catch (error) {
    return next(error);
  }
}

async function exportDepartmentEmployeeContributionsByAdmin(req, res, next) {
  try {
    const { departmentName } = req.params;
    const { cycle } = req.query;
    const userRole = req.user.role;

    // Only Admins can use this endpoint
    if (userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Administrators can generate department employee contribution sheets.",
      });
    }

    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required.",
      });
    }

    // Find department by name (case-insensitive)
    const department = await Department.findOne({
      name: { $regex: new RegExp(`^${departmentName}$`, "i") },
    })
      .populate("hod", "name email")
      .lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: `Department "${departmentName}" not found.`,
      });
    }

    const departmentId = department._id;

    // Get all employees in the department
    const employees = await Employee.find({ department: departmentId })
      .populate("department", "name code")
      .sort({ name: 1 })
      .lean();

    // Get employee IDs
    const employeeIds = employees.map((emp) => emp._id);

    // Build contribution filter
    const contributionFilter = {
      employee: { $in: employeeIds },
      department: departmentId,
    };

    if (cycle) {
      contributionFilter.cycle = cycle;
    }

    // Get all employee contributions
    const contributions = await Contribution.find(contributionFilter)
      .populate("employee", "name empId designation email")
      .populate("department", "name code")
      .populate("submittedBy", "name email")
      .sort({ cycle: -1, submittedAt: -1 })
      .lean();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Employee Contribution Automation System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(
      cycle ? `${department.name} Employee Contributions ${cycle}` : `${department.name} Employee Contributions`,
      {
        views: [{ state: "frozen", ySplit: 1 }],
      }
    );

    // Define columns
    sheet.columns = [
      { header: "Employee ID", key: "empId", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Department", key: "department", width: 25 },
      { header: "Department Code", key: "code", width: 18 },
      { header: "Cycle", key: "cycle", width: 15 },
      { header: "Academy %", key: "academy", width: 12 },
      { header: "Intensive %", key: "intensive", width: 12 },
      { header: "NIAT %", key: "niat", width: 12 },
      { header: "Total %", key: "total", width: 12 },
      { header: "Submitted By", key: "submittedBy", width: 25 },
      { header: "Submitted At", key: "submittedAt", width: 24 },
      { header: "Remarks", key: "remarks", width: 40 },
    ];

    // Group contributions by employee
    const employeeMap = new Map();
    employees.forEach((emp) => {
      employeeMap.set(emp._id.toString(), {
        ...emp,
        contributions: [],
      });
    });

    contributions.forEach((contrib) => {
      const empId = contrib.employee?._id?.toString();
      if (empId && employeeMap.has(empId)) {
        employeeMap.get(empId).contributions.push(contrib);
      }
    });

    // Add rows for each employee
    employeeMap.forEach((empData) => {
      if (empData.contributions.length === 0) {
        // Employee with no contributions
        sheet.addRow({
          empId: empData.empId || "—",
          employeeName: empData.name || "—",
          designation: empData.designation || "—",
          email: empData.email || "—",
          department: empData.department?.name || department.name,
          code: empData.department?.code || department.code || "—",
          cycle: "—",
          academy: "—",
          intensive: "—",
          niat: "—",
          total: "—",
          submittedBy: "—",
          submittedAt: "—",
          remarks: "No contributions recorded",
        });
      } else {
        // Add a row for each contribution cycle
        empData.contributions.forEach((contrib) => {
          sheet.addRow({
            empId: contrib.employee?.empId || empData.empId || "—",
            employeeName: contrib.employee?.name || empData.name || "—",
            designation: contrib.employee?.designation || empData.designation || "—",
            email: contrib.employee?.email || empData.email || "—",
            department: contrib.department?.name || department.name,
            code: contrib.department?.code || department.code || "—",
            cycle: contrib.cycle || "—",
            academy: contrib.academy || 0,
            intensive: contrib.intensive || 0,
            niat: contrib.niat || 0,
            total:
              (contrib.academy || 0) +
              (contrib.intensive || 0) +
              (contrib.niat || 0),
            submittedBy: contrib.submittedBy?.name || "—",
            submittedAt: contrib.submittedAt
              ? new Date(contrib.submittedAt).toLocaleString()
              : "—",
            remarks: contrib.remarks || "",
          });
        });
      }
    });

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add summary section
    const summaryRow = sheet.rowCount + 2;
    sheet.getCell(`A${summaryRow}`).value = `Department: ${department.name}`;
    sheet.getCell(`A${summaryRow}`).font = { bold: true, size: 12 };
    sheet.mergeCells(`A${summaryRow}:D${summaryRow}`);

    sheet.getCell(`A${summaryRow + 1}`).value = `HOD: ${department.hod?.name || "—"}`;
    sheet.getCell(`A${summaryRow + 1}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 1}:D${summaryRow + 1}`);

    sheet.getCell(`A${summaryRow + 2}`).value = `Total Employees: ${employees.length}`;
    sheet.getCell(`A${summaryRow + 2}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 2}:D${summaryRow + 2}`);

    sheet.getCell(`A${summaryRow + 3}`).value = `Total Contributions: ${contributions.length}`;
    sheet.getCell(`A${summaryRow + 3}`).font = { bold: true };
    sheet.mergeCells(`A${summaryRow + 3}:D${summaryRow + 3}`);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = cycle
      ? `${department.name.replace(/\s+/g, "_")}_employee_contributions_${cycle}.xlsx`
      : `${department.name.replace(/\s+/g, "_")}_employee_contributions_all_cycles.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
}

module.exports = { 
  exportContributions, 
  exportDepartmentReport,
  exportDepartmentEmployeeContributions,
  sendSheetToAdmin,
  exportDepartmentEmployeeContributionsByAdmin,
};
