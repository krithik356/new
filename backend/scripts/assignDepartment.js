require("dotenv").config();
const mongoose = require("mongoose");
const { User } = require("../src/models/User");
const { Department } = require("../src/models/Department");
const { connectDB, disconnectDB } = require("../src/config/db");

async function assignDepartment() {
  try {
    await connectDB();

    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log("\nUsage: node scripts/assignDepartment.js <userEmail> <departmentName>\n");
      console.log("Example: node scripts/assignDepartment.js podichettykrithik@gmail.com Tech\n");
      process.exit(1);
    }

    const [userEmail, departmentName] = args;

    // Find user
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      console.error(`\n❌ User not found: ${userEmail}\n`);
      process.exit(1);
    }

    if (user.role !== "HOD") {
      console.error(`\n❌ User ${userEmail} is not an HOD. Current role: ${user.role}\n`);
      process.exit(1);
    }

    // Find department
    const department = await Department.findOne({
      name: { $regex: new RegExp(`^${departmentName}$`, "i") },
    });

    if (!department) {
      console.error(`\n❌ Department not found: ${departmentName}`);
      console.log("\nAvailable departments:");
      const allDepts = await Department.find().select("name code");
      allDepts.forEach((d) => {
        console.log(`  - ${d.name}${d.code ? ` (${d.code})` : ""}`);
      });
      console.log();
      process.exit(1);
    }

    // Assign department
    user.department = department._id;
    await user.save();

    console.log("\n✅ Department assigned successfully!\n");
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Department: ${department.name}${department.code ? ` (${department.code})` : ""}`);
    console.log(`Role: ${user.role}\n`);

    await disconnectDB();
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

assignDepartment();

