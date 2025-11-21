const mongoose = require("mongoose");
const { Contractor } = require("../models/Contractor");
const { Vendor } = require("../models/Vendor");
const { Intern } = require("../models/Intern");
const { ProductNonPayroll } = require("../models/ProductNonPayroll");
const { NonPayrollSpend } = require("../models/NonPayrollSpend");
const { ContractRisk } = require("../models/ContractRisk");

function ensureDepartmentForHod(req, res) {
  if (req.user.role === "HOD" && !req.user.department) {
    res.status(400).json({
      success: false,
      message:
        "You must be assigned to a department to view this information.",
    });
    return false;
  }
  return true;
}

function buildMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function sumSpend(doc) {
  return (doc.contractorSpend || 0) + (doc.vendorSpend || 0) + (doc.internSpend || 0);
}

async function getOverview(req, res, next) {
  try {
    const now = new Date();
    const monthKey = buildMonthKey(now);
    const currentYear = String(now.getFullYear());

    const [spendDocs, contractorCount, vendorCount, internCount, vendors, contractors, risks] =
      await Promise.all([
        NonPayrollSpend.find({})
          .populate("department", "name code")
          .lean(),
        Contractor.countDocuments(),
        Vendor.countDocuments(),
        Intern.countDocuments(),
        Vendor.find({})
          .select("name category monthlyCost performanceScore riskLevel contractEnd departmentsUsing")
          .lean(),
        Contractor.find({}).select("name role efficiencyScore monthlyCost department contractEnd status").populate("department", "name code").lean(),
        ContractRisk.find({})
          .populate("department", "name code")
          .lean(),
      ]);

    const monthlySpend = spendDocs
      .filter((doc) => doc.month === monthKey)
      .reduce((sum, doc) => sum + sumSpend(doc), 0);

    const ytdSpend = spendDocs
      .filter((doc) => doc.month.startsWith(currentYear))
      .reduce((sum, doc) => sum + sumSpend(doc), 0);

    let contractorSplit = 0;
    let vendorSplit = 0;
    let internSplit = 0;
    const departmentSpendMap = new Map();

    spendDocs.forEach((doc) => {
      contractorSplit += doc.contractorSpend || 0;
      vendorSplit += doc.vendorSpend || 0;
      internSplit += doc.internSpend || 0;
      if (doc.department) {
        const deptKey = doc.department._id
          ? String(doc.department._id)
          : String(doc.department);
        const existing = departmentSpendMap.get(deptKey) || {
          id: deptKey,
          name: doc.department?.name || "Unknown",
          code: doc.department?.code || "",
          spend: 0,
        };
        existing.spend += sumSpend(doc);
        departmentSpendMap.set(deptKey, existing);
      }
    });

    const topVendors = vendors
      .sort((a, b) => (b.monthlyCost || 0) - (a.monthlyCost || 0))
      .slice(0, 5);

    const topContractors = contractors
      .sort((a, b) => (b.efficiencyScore || 0) - (a.efficiencyScore || 0))
      .slice(0, 5);

    const highRiskResources = risks
      .filter((risk) => ["high", "critical"].includes(risk.riskLevel))
      .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt))
      .slice(0, 5);

    const upcomingContractors = contractors
      .filter(
        (c) =>
          c.contractEnd &&
          new Date(c.contractEnd) - now <= 45 * 24 * 60 * 60 * 1000 &&
          new Date(c.contractEnd) >= now
      )
      .sort((a, b) => new Date(a.contractEnd) - new Date(b.contractEnd))
      .slice(0, 5)
      .map((c) => ({
        id: c._id,
        name: c.name,
        department: c.department?.name || "Unknown",
        endsOn: c.contractEnd,
        status: c.status,
      }));

    const upcomingVendors = vendors
      .filter(
        (v) =>
          v.contractEnd &&
          new Date(v.contractEnd) - now <= 60 * 24 * 60 * 60 * 1000 &&
          new Date(v.contractEnd) >= now
      )
      .sort((a, b) => new Date(a.contractEnd) - new Date(b.contractEnd))
      .slice(0, 5)
      .map((v) => ({
        id: v._id,
        name: v.name,
        category: v.category,
        endsOn: v.contractEnd,
        riskLevel: v.riskLevel,
      }));

    return res.json({
      success: true,
      data: {
        totals: {
          monthlySpend,
          ytdSpend,
        },
        counts: {
          contractors: contractorCount,
          vendors: vendorCount,
          interns: internCount,
        },
        split: {
          contractors: contractorSplit,
          vendors: vendorSplit,
          interns: internSplit,
        },
        departmentSpend: Array.from(departmentSpendMap.values()).sort(
          (a, b) => b.spend - a.spend
        ),
        topVendors,
        topContractors,
        highRiskResources,
        contractAlerts: {
          contractors: upcomingContractors,
          vendors: upcomingVendors,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getContractors(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "HOD") {
      if (!ensureDepartmentForHod(req, res)) {
        return;
      }
      filter.department = req.user.department;
    } else if (req.query.departmentId) {
      if (!mongoose.isValidObjectId(req.query.departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department id.",
        });
      }
      filter.department = req.query.departmentId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const contractors = await Contractor.find(filter)
      .populate("department", "name code")
      .sort({ efficiencyScore: -1 })
      .lean();

    const totalHours = contractors.reduce(
      (sum, contractor) => sum + (contractor.hoursWorked || 0),
      0
    );
    const totalSpend = contractors.reduce(
      (sum, contractor) =>
        sum + (contractor.monthlyCost || contractor.hourlyRate * contractor.hoursWorked || 0),
      0
    );
    const totalOutput = contractors.reduce(
      (sum, contractor) => sum + (contractor.outputDelivered || 0),
      0
    );
    const averageEfficiency =
      contractors.length > 0
        ? contractors.reduce(
            (sum, contractor) => sum + (contractor.efficiencyScore || 0),
            0
          ) / contractors.length
        : 0;

    let departmentView = [];
    if (req.user.role === "Admin") {
      const grouped = contractors.reduce((acc, contractor) => {
        const deptName = contractor.department?.name || "Unassigned";
        if (!acc[deptName]) {
          acc[deptName] = {
            name: deptName,
            code: contractor.department?.code,
            headcount: 0,
            spend: 0,
            efficiency: 0,
          };
        }
        acc[deptName].headcount += 1;
        acc[deptName].spend +=
          contractor.monthlyCost ||
          contractor.hourlyRate * contractor.hoursWorked ||
          0;
        acc[deptName].efficiency += contractor.efficiencyScore || 0;
        return acc;
      }, {});
      departmentView = Object.values(grouped).map((dept) => ({
        ...dept,
        efficiency:
          dept.headcount > 0 ? dept.efficiency / dept.headcount : dept.efficiency,
      }));
    }

    return res.json({
      success: true,
      data: {
        summary: {
          headcount: contractors.length,
          totalHours,
          totalSpend,
          totalOutput,
          averageEfficiency: Number(averageEfficiency.toFixed(2)),
        },
        departmentComparison: departmentView,
        contractors,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getVendors(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "HOD") {
      if (!ensureDepartmentForHod(req, res)) {
        return;
      }
      filter.departmentsUsing = req.user.department;
    } else if (req.query.departmentId) {
      if (!mongoose.isValidObjectId(req.query.departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department id.",
        });
      }
      filter.departmentsUsing = req.query.departmentId;
    }

    const vendors = await Vendor.find(filter)
      .populate("departmentsUsing", "name code")
      .sort({ monthlyCost: -1 })
      .lean();

    const totalCost = vendors.reduce(
      (sum, vendor) => sum + (vendor.monthlyCost || 0),
      0
    );
    const categories = vendors.reduce((map, vendor) => {
      const key = vendor.category || "Other";
      map[key] = (map[key] || 0) + (vendor.monthlyCost || 0);
      return map;
    }, {});

    const riskSummary = vendors.reduce(
      (summary, vendor) => {
        summary[vendor.riskLevel || "low"] =
          (summary[vendor.riskLevel || "low"] || 0) + 1;
        return summary;
      },
      { low: 0, medium: 0, high: 0 }
    );

    const performanceLeaderboard = vendors
      .map((vendor) => ({
        id: vendor._id,
        name: vendor.name,
        performanceScore: vendor.performanceScore || 0,
        monthlyCost: vendor.monthlyCost || 0,
        category: vendor.category,
        riskLevel: vendor.riskLevel,
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10);

    return res.json({
      success: true,
      data: {
        summary: {
          vendors: vendors.length,
          totalCost,
        },
        costByCategory: Object.entries(categories).map(([name, value]) => ({
          name,
          value,
        })),
        riskSummary,
        performanceLeaderboard,
        vendors,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getInterns(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === "HOD") {
      if (!ensureDepartmentForHod(req, res)) {
        return;
      }
      filter.department = req.user.department;
    } else if (req.query.departmentId) {
      if (!mongoose.isValidObjectId(req.query.departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department id.",
        });
      }
      filter.department = req.query.departmentId;
    }

    const interns = await Intern.find(filter)
      .populate("department", "name code")
      .sort({ performanceRating: -1 })
      .lean();

    const totalStipend = interns.reduce(
      (sum, intern) => sum + (intern.stipend || 0),
      0
    );

    const performanceByProduct = interns.reduce((acc, intern) => {
      const key = intern.productAssigned || "Unassigned";
      if (!acc[key]) {
        acc[key] = {
          product: key,
          count: 0,
          stipend: 0,
          performance: 0,
        };
      }
      acc[key].count += 1;
      acc[key].stipend += intern.stipend || 0;
      acc[key].performance += intern.performanceRating || 0;
      return acc;
    }, {});

    const productStats = Object.values(performanceByProduct).map((product) => ({
      ...product,
      avgPerformance:
        product.count > 0 ? product.performance / product.count : 0,
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          interns: interns.length,
          totalStipend,
          averageTasks:
            interns.length > 0
              ? interns.reduce(
                  (sum, intern) => sum + (intern.tasksCompleted || 0),
                  0
                ) / interns.length
              : 0,
        },
        productStats,
        interns,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const products = await ProductNonPayroll.find({})
      .populate("departmentBreakdown.department", "name code")
      .lean();

    const responseProducts = products.map((product) => {
      let breakdown = product.departmentBreakdown || [];
      if (req.user.role === "HOD") {
        if (!ensureDepartmentForHod(req, res)) {
          return null;
        }
        breakdown = breakdown.filter(
          (entry) =>
            entry.department &&
            String(entry.department._id || entry.department) ===
              String(req.user.department)
        );
      }
      return {
        id: product._id,
        productName: product.productName,
        contractorCosts: product.contractorCosts,
        vendorCosts: product.vendorCosts,
        internCosts: product.internCosts,
        outputScore: product.outputScore,
        departmentBreakdown: breakdown,
      };
    });

    return res.json({
      success: true,
      data: responseProducts.filter(Boolean),
    });
  } catch (error) {
    return next(error);
  }
}

function buildYearMonthFilter({ year, month }) {
  const filter = {};
  if (!year) {
    return filter;
  }
  const yearStr = String(year);
  if (month && month !== "all") {
    const monthNumber = Number(month);
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      throw new Error("Invalid month parameter.");
    }
    filter.month = `${yearStr}-${String(monthNumber).padStart(2, "0")}`;
  } else {
    filter.month = { $regex: `^${yearStr}-` };
  }
  return filter;
}

async function getSpendEfficiency(req, res, next) {
  try {
    const currentYear = new Date().getFullYear();
    const requestedYear = Number(req.query.year) || currentYear;
    const monthParam = req.query.month || "all";

    const filter = {};
    if (req.user.role === "HOD") {
      if (!ensureDepartmentForHod(req, res)) {
        return;
      }
      filter.department = req.user.department;
    }

    // Determine available years for filter controls
    const availableMonthsDocs = await NonPayrollSpend.find(filter)
      .select("month -_id")
      .lean();
    const availableYears = Array.from(
      new Set(availableMonthsDocs.map((doc) => doc.month.slice(0, 4)))
    )
      .map((yearStr) => Number(yearStr))
      .sort((a, b) => b - a);

    let spendFilter;
    try {
      spendFilter = buildYearMonthFilter({
        year: requestedYear,
        month: monthParam,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid filters supplied.",
      });
    }

    const spendDocs = await NonPayrollSpend.find({
      ...filter,
      ...spendFilter,
    })
      .populate("department", "name code")
      .sort({ month: 1 })
      .lean();

    if (req.user.role === "HOD") {
      const trend = spendDocs.map((doc) => ({
        month: doc.month,
        spend: sumSpend(doc),
        efficiency: doc.efficiencyScore || 0,
        split: {
          contractors: doc.contractorSpend || 0,
          vendors: doc.vendorSpend || 0,
          interns: doc.internSpend || 0,
        },
      }));

      const totalSpend = trend.reduce((sum, entry) => sum + entry.spend, 0);

      return res.json({
        success: true,
        data: {
          trend,
          totalSpend,
          latestEfficiency: trend.at(-1)?.efficiency ?? null,
          availableYears,
          selectedYear: requestedYear,
        },
      });
    }

    // Admin view
    const byDepartment = spendDocs.reduce((acc, doc) => {
      const deptName = doc.department?.name || "Unassigned";
      if (!acc[deptName]) {
        acc[deptName] = {
          name: deptName,
          code: doc.department?.code,
          spend: 0,
          efficiency: 0,
          points: 0,
        };
      }
      acc[deptName].spend += sumSpend(doc);
      acc[deptName].efficiency += doc.efficiencyScore || 0;
      acc[deptName].points += 1;
      return acc;
    }, {});

    const departmentEfficiency = Object.values(byDepartment).map((dept) => ({
      ...dept,
      averageEfficiency:
        dept.points > 0 ? dept.efficiency / dept.points : dept.efficiency,
    }));

    const trendByMonth = spendDocs.reduce((acc, doc) => {
      if (!acc[doc.month]) {
        acc[doc.month] = {
          month: doc.month,
          spend: 0,
          efficiency: 0,
          points: 0,
        };
      }
      acc[doc.month].spend += sumSpend(doc);
      acc[doc.month].efficiency += doc.efficiencyScore || 0;
      acc[doc.month].points += 1;
      return acc;
    }, {});

    const trend = Object.values(trendByMonth)
      .sort((a, b) => (a.month > b.month ? 1 : -1))
      .map((entry) => ({
        month: entry.month,
        spend: entry.spend,
        averageEfficiency:
          entry.points > 0 ? entry.efficiency / entry.points : entry.efficiency,
      }));

    return res.json({
      success: true,
      data: {
        departmentEfficiency,
        trend,
        totalSpend: trend.reduce((sum, entry) => sum + entry.spend, 0),
        availableYears,
        selectedYear: requestedYear,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getContractsAndRisks(req, res, next) {
  try {
    const riskFilter = {};
    let contractorFilter = {};
    let vendorFilter = {};

    if (req.user.role === "HOD") {
      if (!ensureDepartmentForHod(req, res)) {
        return;
      }
      riskFilter.department = req.user.department;
      contractorFilter = { department: req.user.department };
      vendorFilter = { departmentsUsing: req.user.department };
    }

    const [risks, contractors, vendors] = await Promise.all([
      ContractRisk.find(riskFilter)
        .populate("department", "name code")
        .sort({ riskLevel: -1, dueDate: 1 })
        .lean(),
      Contractor.find(contractorFilter)
        .select("name role department contractEnd status")
        .populate("department", "name code")
        .lean(),
      Vendor.find(vendorFilter)
        .select("name category contractEnd riskLevel")
        .lean(),
    ]);

    const upcomingContractors = contractors
      .filter(
        (c) =>
          c.contractEnd &&
          new Date(c.contractEnd) - Date.now() <= 60 * 24 * 60 * 60 * 1000 &&
          new Date(c.contractEnd) >= new Date()
      )
      .map((c) => ({
        id: c._id,
        name: c.name,
        department: c.department?.name || "Unassigned",
        endsOn: c.contractEnd,
        status: c.status,
      }));

    const upcomingVendors = vendors
      .filter(
        (v) =>
          v.contractEnd &&
          new Date(v.contractEnd) - Date.now() <= 90 * 24 * 60 * 60 * 1000 &&
          new Date(v.contractEnd) >= new Date()
      )
      .map((v) => ({
        id: v._id,
        name: v.name,
        category: v.category,
        endsOn: v.contractEnd,
        riskLevel: v.riskLevel,
      }));

    const complianceIssues = risks
      .filter((risk) => risk.complianceIssue)
      .map((risk) => ({
        id: risk._id,
        description: risk.description,
        riskLevel: risk.riskLevel,
        dueDate: risk.dueDate,
        department: risk.department?.name || "Unassigned",
      }));

    return res.json({
      success: true,
      data: {
        risks,
        upcomingExpiries: {
          contractors: upcomingContractors,
          vendors: upcomingVendors,
        },
        complianceIssues,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getOverview,
  getContractors,
  getVendors,
  getInterns,
  getProducts,
  getSpendEfficiency,
  getContractsAndRisks,
};

