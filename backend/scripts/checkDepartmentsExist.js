require("dotenv").config();

const { connectDB, disconnectDB } = require("../src/config/db");
const { Department } = require("../src/models/Department");

const departmentsToCheck = [
  "Management",
  "Sales",
  "Pre-Sales",
  "Sales - Intensive",
  "Placement - Corporate Relations",
  "Student Success - Academy",
  "Student Success - Intensive",
  "Placement Success Manager",
  "Query Resolution",
  "NIAT - Academics",
  "Video House",
  "PRE",
  "Content - DS&ML",
  "University Partnership",
  "Talent Acquisition",
  "Product",
  "Business Ops",
  "Placement - Content",
  "NIAT Masterclass",
  "NIAT - Robotics",
  "Content - DS&Algo",
  "Student Success - NIAT",
  "Human Resource",
  "NIAT - Program Ops",
  "Abroad",
  "Founders Office",
  "10xIIT",
  "NxtWave Edge - Colleges",
  "Intensive Offline",
  "Assessments POD",
  "Internal Audit",
  "Finance",
  "GenAI Social Media",
  "AI&Beyond",
  "Content - MERN",
  "HR - Admin/Facilities",
  "Branding",
  "HR - Learning & Development",
  "Policy & Strategic Partnerships",
  "NIFA",
  "Pre-Sales - Intensive",
  "NIAT - Hiring team",
  "Masterclass",
  "NxtGen LP",
];

async function run() {
  try {
    await connectDB();

    const existingDepartments = await Department.find(
      { name: { $in: departmentsToCheck } },
      { name: 1, _id: 0 }
    ).lean();

    const existingNames = new Set(existingDepartments.map((d) => d.name));

    const found = [];
    const missing = [];

    for (const name of departmentsToCheck) {
      if (existingNames.has(name)) {
        found.push(name);
      } else {
        missing.push(name);
      }
    }

    console.log("=== Department Presence Check ===");
    console.log("\nPresent in DB:");
    if (found.length === 0) {
      console.log("  (none)");
    } else {
      for (const name of found) {
        console.log(`  - ${name}`);
      }
    }

    console.log("\nNOT present in DB:");
    if (missing.length === 0) {
      console.log("  (none)");
    } else {
      for (const name of missing) {
        console.log(`  - ${name}`);
      }
    }
  } catch (err) {
    console.error("Error while checking departments:", err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

run();


