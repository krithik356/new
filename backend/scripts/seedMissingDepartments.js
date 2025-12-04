require("dotenv").config();

const { connectDB, disconnectDB } = require("../src/config/db");
const { Department } = require("../src/models/Department");

const allDepartments = [
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

function generateCode(name) {
  // Take uppercase letters & first chars, fallback to cleaned name
  const words = name.split(/\s|-/).filter(Boolean);
  let code = words.map((w) => w[0]).join("");
  if (!code) {
    code = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 6);
  }
  return code.toUpperCase().slice(0, 10);
}

async function run() {
  try {
    await connectDB();

    const existing = await Department.find(
      { name: { $in: allDepartments } },
      { name: 1, _id: 0 }
    ).lean();

    const existingNames = new Set(existing.map((d) => d.name));

    const toInsert = allDepartments
      .filter((name) => !existingNames.has(name))
      .map((name) => ({
        name,
        code: generateCode(name),
      }));

    console.log("=== Seeding Departments ===");
    console.log(`Total in list: ${allDepartments.length}`);
    console.log(`Already present: ${existingNames.size}`);
    console.log(`To insert now: ${toInsert.length}`);

    if (toInsert.length > 0) {
      const inserted = await Department.insertMany(toInsert);
      console.log("\nInserted departments:");
      inserted.forEach((d) => {
        console.log(`  - ${d.name} (code: ${d.code})`);
      });
    } else {
      console.log("\nNo new departments to insert.");
    }

    console.log("\nAll done.");
  } catch (err) {
    console.error("Error while seeding departments:", err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

run();


