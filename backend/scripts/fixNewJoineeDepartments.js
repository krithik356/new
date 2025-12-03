/* eslint-disable no-console */

require("dotenv").config();

const { connectDB, disconnectDB } = require("../src/config/db");
const { Department } = require("../src/models/Department");
const { NewJoineePayroll } = require("../src/models/NewJoineePayroll");

/**
 * Usage:
 *   node scripts/fixNewJoineeDepartments.js Tech
 *
 * This script remaps all new-joinee payroll entries whose department
 * label/keys match the given department name so that their `department`,
 * `departmentKey`, and `departmentLabel` fields point to the CURRENT
 * Department document.
 *
 * This fixes 403 errors for HODs ("You can only edit entries from your
 * department") that happen when records still reference an old/removed
 * Department ObjectId.
 */
async function run() {
  await connectDB();

  const [, , departmentNameArg] = process.argv;

  if (!departmentNameArg) {
    console.error(
      "\nUsage: node scripts/fixNewJoineeDepartments.js <DepartmentName>\n"
    );
    console.error("Example: node scripts/fixNewJoineeDepartments.js Tech\n");
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

  // Match New Joinee rows by departmentLabel / departmentKey / topDepartment.
  // This is robust even if their `department` ObjectId still points at an old,
  // deleted document.
  const filter = {
    $or: [
      { departmentLabel: department.name },
      { departmentKey: department.name.toLowerCase() },
      { topDepartment: department.name },
    ],
  };

  const update = {
    $set: {
      department: department._id,
      departmentKey: (department.code || department.name).toLowerCase().replace(/\s+/g, "-"),
      departmentLabel: department.name,
    },
  };

  console.log("🛠  Updating matching New Joinee records…");

  const result = await NewJoineePayroll.updateMany(filter, update);

  console.log(
    `\n✅ Done. Matched ${result.matchedCount ?? result.n} record(s), ` +
      `modified ${result.modifiedCount ?? result.nModified}.\n`
  );

  await disconnectDB();
}

run().catch((error) => {
  console.error("\n❌ Error while fixing new joinee department mappings:", error);
  disconnectDB().finally(() => process.exit(1));
});


