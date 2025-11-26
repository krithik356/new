require("dotenv").config();
const { connectDB, disconnectDB } = require("../src/config/db");
const { Department } = require("../src/models/Department");
const { Contractor } = require("../src/models/Contractor");
const { Vendor } = require("../src/models/Vendor");
const { Intern } = require("../src/models/Intern");
const { ProductNonPayroll } = require("../src/models/ProductNonPayroll");
const { NonPayrollSpend } = require("../src/models/NonPayrollSpend");
const { ContractRisk } = require("../src/models/ContractRisk");

const PRODUCT_NAMES = ["Academy", "Intensive", "NIAT"];

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seedNonPayroll() {
  await connectDB();
  const departments = await Department.find().lean();
  if (departments.length === 0) {
    throw new Error("Seed departments before seeding non-payroll data.");
  }

  console.log("Clearing existing non-payroll collections...");
  await Promise.all([
    Contractor.deleteMany({}),
    Vendor.deleteMany({}),
    Intern.deleteMany({}),
    ProductNonPayroll.deleteMany({}),
    NonPayrollSpend.deleteMany({}),
    ContractRisk.deleteMany({}),
  ]);

  const departmentIds = departments.map((dept) => dept._id);

  console.log("Seeding contractors...");
  const contractorRoles = [
    "Full-stack Engineer",
    "Data Analyst",
    "DevOps Specialist",
    "Product Consultant",
    "QA Expert",
  ];
  const contractorDocs = Array.from({ length: 10 }).map((_, index) => {
    const department = departments[index % departments.length];
    const hours = 80 + Math.floor(Math.random() * 40);
    const monthlyCost = 80000 + Math.floor(Math.random() * 30000);
    const efficiency = 60 + Math.random() * 30;
    return {
      name: `Contractor ${index + 1}`,
      department: department._id,
      role: pickRandom(contractorRoles),
      hourlyRate: Math.round(monthlyCost / hours),
      monthlyCost,
      hoursWorked: hours,
      outputDelivered: 50 + Math.floor(Math.random() * 60),
      efficiencyScore: Number(efficiency.toFixed(2)),
      contractStart: futureDate(-120 - index * 5),
      contractEnd: futureDate(60 + index * 7),
      status: "active",
      rating: Number((3 + Math.random() * 2).toFixed(1)),
      deliverablesCompleted: 5 + Math.floor(Math.random() * 8),
    };
  });
  const contractors = await Contractor.insertMany(contractorDocs);

  console.log("Seeding vendors...");
  const vendorCategories = [
    "IT Support",
    "Marketing",
    "Operations",
    "Design",
    "Security",
    "Editing",
  ];

  const vendorDocs = vendorCategories.map((category, index) => {
    const departmentsUsing = departmentIds.filter((_, deptIndex) =>
      (deptIndex + index) % 2 === 0
    );
    return {
      name: `${category} Partner`,
      category,
      departmentsUsing,
      monthlyCost: 60000 + Math.floor(Math.random() * 40000),
      deliverables: `${category} deliverables`,
      riskLevel: pickRandom(["low", "medium", "high"]),
      contractStart: futureDate(-200 - index * 10),
      contractEnd: futureDate(90 + index * 12),
      performanceScore: 60 + Math.floor(Math.random() * 35),
      dependencyLevel: pickRandom(["low", "medium", "high"]),
      issuesLogged: Math.floor(Math.random() * 5),
    };
  });
  const vendors = await Vendor.insertMany(vendorDocs);

  console.log("Seeding interns...");
  const internDocs = Array.from({ length: 8 }).map((_, index) => {
    const department = departments[index % departments.length];
    return {
      name: `Intern ${index + 1}`,
      department: department._id,
      stipend: 15000 + Math.floor(Math.random() * 5000),
      mentor: `${department.name} Mentor`,
      tasksCompleted: 5 + Math.floor(Math.random() * 10),
      performanceRating: Number((3 + Math.random() * 2).toFixed(1)),
      productAssigned: PRODUCT_NAMES[index % PRODUCT_NAMES.length],
      progress: 40 + Math.floor(Math.random() * 50),
    };
  });
  await Intern.insertMany(internDocs);

  console.log("Seeding product non-payroll data...");
  const productDocs = PRODUCT_NAMES.map((productName) => {
    const contractorCosts = 200000 + Math.floor(Math.random() * 80000);
    const vendorCosts = 150000 + Math.floor(Math.random() * 70000);
    const internCosts = 60000 + Math.floor(Math.random() * 20000);
    return {
      productName,
      contractorCosts,
      vendorCosts,
      internCosts,
      outputScore: Number((65 + Math.random() * 25).toFixed(2)),
      departmentBreakdown: departments.map((dept) => ({
        department: dept._id,
        contractorCosts: Math.round(contractorCosts / departments.length),
        vendorCosts: Math.round(vendorCosts / departments.length),
        internCosts: Math.round(internCosts / departments.length),
        outputScore: Number((60 + Math.random() * 30).toFixed(2)),
      })),
    };
  });
  await ProductNonPayroll.insertMany(productDocs);

  console.log("Seeding monthly spend data...");
  const spendDocs = [];
  const startDate = new Date(2023, 0, 1);
  const now = new Date();
  const monthKeys = [];
  const cursor = new Date(startDate.getTime());
  while (cursor <= now) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    monthKeys.push(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  departments.forEach((dept) => {
    monthKeys.forEach((month) => {
      const contractorSpend = 100000 + Math.floor(Math.random() * 80000);
      const vendorSpend = 90000 + Math.floor(Math.random() * 60000);
      const internSpend = 30000 + Math.floor(Math.random() * 15000);
      spendDocs.push({
        department: dept._id,
        month,
        contractorSpend,
        vendorSpend,
        internSpend,
        efficiencyScore: Number((60 + Math.random() * 30).toFixed(2)),
      });
    });
  });
  await NonPayrollSpend.insertMany(spendDocs);

  console.log("Seeding contract risks...");
  const riskDocs = Array.from({ length: 5 }).map((_, index) => {
    const resourceType = index % 2 === 0 ? "contractor" : "vendor";
    const collection = resourceType === "contractor" ? contractors : vendors;
    const resource = collection[index % collection.length];
    const department =
      resourceType === "contractor"
        ? resource.department
        : resource.departmentsUsing[0];
    return {
      resourceId: resource._id,
      resourceType,
      department,
      riskLevel: pickRandom(["medium", "high", "critical"]),
      description: `${resourceType} risk ${index + 1}`,
      dueDate: futureDate(15 + index * 7),
      complianceIssue: index % 2 === 0,
      status: pickRandom(["open", "in-progress", "resolved"]),
    };
  });
  await ContractRisk.insertMany(riskDocs);

  console.log("✅ Non-payroll data seeded successfully.");
  await disconnectDB();
}

seedNonPayroll()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed non-payroll data:", error);
    process.exit(1);
  });

