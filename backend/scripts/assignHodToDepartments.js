require("dotenv").config();
const mongoose = require("mongoose");
const { User } = require("../src/models/User");
const { Department } = require("../src/models/Department");
const { connectDB, disconnectDB } = require("../src/config/db");

/**
 * Script to assign HOD to multiple departments
 * Usage: node scripts/assignHodToDepartments.js <userEmail> <departmentName1> <departmentName2> ...
 * Example: node scripts/assignHodToDepartments.js vamshi@example.com "AC_Customer Support (NWD_ASS_ACCS)" "Central Team- Academy Student Success (NWD_ASS_CT)"
 */
async function assignHodToDepartments() {
  try {
    await connectDB();

    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log("\nUsage: node scripts/assignHodToDepartments.js <userEmail> <departmentName1> [departmentName2] ...\n");
      console.log("Example: node scripts/assignHodToDepartments.js vamshi@example.com \"AC_Customer Support (NWD_ASS_ACCS)\"\n");
      process.exit(1);
    }

    const [userEmail, ...departmentNames] = args;

    // Find user
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      console.error(`\n❌ User not found: ${userEmail}\n`);
      process.exit(1);
    }

    if (user.role !== "HOD" && user.role !== "DataFiller") {
      console.error(`\n❌ User ${userEmail} is not an HOD. Current role: ${user.role}\n`);
      process.exit(1);
    }

    console.log(`\n✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user._id}\n`);

    const updatedDepartments = [];
    const notFoundDepartments = [];

    for (const deptName of departmentNames) {
      // Try to find department by exact name match first
      let department = await Department.findOne({
        name: deptName.trim(),
      });

      // If not found, try partial match
      if (!department) {
        department = await Department.findOne({
          name: { $regex: new RegExp(deptName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") },
        });
      }

      // If still not found, try matching by code (if provided in parentheses)
      if (!department && deptName.includes("(") && deptName.includes(")")) {
        const codeMatch = deptName.match(/\(([^)]+)\)/);
        if (codeMatch) {
          const code = codeMatch[1].trim();
          department = await Department.findOne({
            code: code,
          });
        }
      }

      if (!department) {
        notFoundDepartments.push(deptName);
        console.log(`❌ Department not found: ${deptName}`);
        continue;
      }

      // Update department's hod field
      department.hod = user._id;
      await department.save();

      updatedDepartments.push({
        name: department.name,
        code: department.code,
        id: department._id,
      });

      console.log(`✅ Assigned HOD to: ${department.name}${department.code ? ` (${department.code})` : ""}`);
    }

    console.log("\n=== Summary ===");
    console.log(`Total departments to assign: ${departmentNames.length}`);
    console.log(`Successfully assigned: ${updatedDepartments.length}`);
    console.log(`Not found: ${notFoundDepartments.length}`);

    if (notFoundDepartments.length > 0) {
      console.log("\nDepartments not found:");
      notFoundDepartments.forEach((name) => {
        console.log(`  - ${name}`);
      });
    }

    // Also update user's assigned department to the first one if not set
    if (updatedDepartments.length > 0 && !user.department) {
      user.department = updatedDepartments[0].id;
      await user.save();
      console.log(`\n✅ Set user's assigned department to: ${updatedDepartments[0].name}`);
    }

    console.log("\n✅ Done!\n");

    await disconnectDB();
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

assignHodToDepartments();

