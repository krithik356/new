/* eslint-disable no-console */

require("dotenv").config();

const { connectDB, disconnectDB } = require("../src/config/db");
const { Department } = require("../src/models/Department");
const { Employee } = require("../src/models/Employee");

/**
 * Usage:
 *   node scripts/fixEmployeeDepartments.js Tech
 *
 * This script remaps all employees whose source/beneficiary department name
 * matches the given department name so that their `department` and
 * `currentDepartment` fields point to the CURRENT Department document.
 *
 * This is useful after running `resetDepartments.js`, which creates new
 * Department ObjectIds but leaves existing Employee references pointing to
 * the old, deleted Department documents.
 */
async function run() {
  await connectDB();

  const [, , departmentNameArg] = process.argv;

  if (!departmentNameArg) {
    console.error(
      "\nUsage: node scripts/fixEmployeeDepartments.js <DepartmentName>\n"
    );
    console.error("Example: node scripts/fixEmployeeDepartments.js Tech\n");
    process.exit(1);
  }

  const departmentName = departmentNameArg.trim();

  console.log(`\n🔍 Looking up Department by name: "${departmentName}"\n`);

  const department = await Department.findOne({
    name: new RegExp(`^${departmentName}$`, "i"),
  }).lean();

  if (!department) {
    console.error(`❌ No Department document found for name "${departmentName}".`);
    await disconnectDB();
    process.exit(1);
  }

  console.log(
    `✅ Found Department "${department.name}" with _id=${department._id.toString()}\n`
  );

  // Match employees by their stored department names – this is robust even
  // if their `department` ObjectId still points at an old, deleted document.
  const filter = {
    $or: [
      { sourceDepartmentName: department.name },
      { beneficiaryDepartmentName: department.name },
    ],
  };

  const update = {
    $set: {
      department: department._id,
      currentDepartment: department._id,
      sourceDepartmentName: department.name,
      beneficiaryDepartmentName: department.name,
    },
  };

  console.log("🛠  Updating matching Employee documents…");

  const result = await Employee.updateMany(filter, update);

  console.log(
    `\n✅ Done. Matched ${result.matchedCount ?? result.n} employee(s), ` +
      `modified ${result.modifiedCount ?? result.nModified}.\n`
  );

  await disconnectDB();
}

run().catch((error) => {
  console.error("\n❌ Error while fixing employee department mappings:", error);
  disconnectDB().finally(() => process.exit(1));
});


