require("dotenv").config();

require("../src/models/Department");
require("../src/models/Employee");
require("../src/models/Contribution");
require("../src/models/MonthlySalary");
require("../src/models/User");

const mongoose = require("mongoose");
const Department = mongoose.model("Department");
const Employee = mongoose.model("Employee");
const Contribution = mongoose.model("Contribution");
const MonthlySalary = mongoose.model("MonthlySalary");
const User = mongoose.model("User");

const { connectDB, disconnectDB } = require("../src/config/db");


const ROLE_OPTIONS = [
  "Junior Developer",
  "Developer",
  "Senior Developer",
  "Tech Lead",
  "Staff Engineer",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEAR_CONFIG = [
  { year: 2024, dropRange: [0.1, 0.2] },
  { year: 2023, dropRange: [0.2, 0.3] },
];

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPercentages() {
  const first = Math.random() * 100;
  const second = Math.random() * (100 - first);
  const third = 100 - first - second;
  return {
    academy: Math.round(first),
    intensive: Math.round(second),
    niat: Math.round(third),
  };
}

async function seedHistoricalData() {
  await connectDB();

  try {
    const adminUser =
      (await User.findOne({ role: "Admin" }).lean()) ||
      (await User.findOne().lean());

    if (!adminUser) {
      throw new Error("No users found to attribute seeded contributions.");
    }

    await Contribution.updateMany(
      { year: { $exists: false } },
      { $set: { year: 2025 } }
    );

    const employees = await Employee.find()
      .populate("department", "name code")
      .lean();

    console.log(`Seeding historical data for ${employees.length} employees...`);

    for (const employee of employees) {
      const designationHistory = {
        ...(employee.designationHistory || {}),
      };
      designationHistory["2025"] = employee.designation || "Developer";

      for (const { year, dropRange } of YEAR_CONFIG) {
        const salaryFactor = 1 - randomFloat(dropRange[0], dropRange[1]);
        const randomizedRole =
          ROLE_OPTIONS[randomInt(0, ROLE_OPTIONS.length - 1)];
        designationHistory[String(year)] = randomizedRole;

        const annualSalary = Math.max(
          0,
          Math.round((employee.salary || 0) * salaryFactor)
        );
        for (const month of MONTHS) {
          const amount = Math.round(annualSalary / 12);
          await MonthlySalary.updateOne(
            { employee: employee._id, month, year },
            {
              $set: {
                employee: employee._id,
                month,
                year,
                amount,
              },
            },
            { upsert: true }
          );
        }

        for (const month of MONTHS) {
          const { academy, intensive, niat } = randomPercentages();
          const cycleKey = `${year}-${month}`;
          const monthIndex = MONTHS.indexOf(month);
          const submittedAt = new Date(
            year,
            monthIndex >= 0 ? monthIndex : 0,
            randomInt(1, 28)
          );

          await Contribution.updateOne(
            {
              employee: employee._id,
              cycle: cycleKey,
              year,
            },
            {
              $set: {
                employee: employee._id,
                department: employee.department?._id,
                academy,
                intensive,
                niat,
                year,
                cycle: cycleKey,
                submittedBy: adminUser._id,
                submittedAt,
                remarks: "Historical data seed",
              },
            },
            { upsert: true }
          );
        }
      }

      await Employee.updateOne(
        { _id: employee._id },
        {
          $set: {
            designation: designationHistory["2025"] || employee.designation,
            designationHistory,
          },
        }
      );
    }

    console.log("Historical contribution & salary data seeded successfully.");
  } catch (error) {
    console.error("Failed to seed historical contributions:", error);
  } finally {
    await disconnectDB();
  }
}

seedHistoricalData();

