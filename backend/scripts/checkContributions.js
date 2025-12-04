/**
 * Script to check contributions for a specific department and year
 * Usage: node scripts/checkContributions.js [departmentId] [year]
 * Example: node scripts/checkContributions.js 693025a4ed290bbc886cbbd8 2025
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { Contribution } = require("../src/models/Contribution");
const { Department } = require("../src/models/Department");
const { User } = require("../src/models/User");
const { connectDB, disconnectDB } = require("../src/config/db");

async function checkContributions(departmentId, year = 2025) {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // If departmentId is not provided, show all departments
    if (!departmentId) {
      console.log("📋 Available Departments:");
      const departments = await Department.find({}).select("_id name code").lean();
      departments.forEach((dept) => {
        console.log(`  - ${dept.name} (${dept.code || "N/A"}): ${dept._id}`);
      });
      console.log("\n💡 Usage: node scripts/checkContributions.js <departmentId> [year]");
      console.log("   Example: node scripts/checkContributions.js 693025a4ed290bbc886cbbd8 2025\n");
      return;
    }

    // Validate department ID
    if (!mongoose.isValidObjectId(departmentId)) {
      console.error("❌ Invalid department ID format");
      return;
    }

    // Get department info
    const department = await Department.findById(departmentId).lean();
    if (!department) {
      console.error(`❌ Department not found: ${departmentId}`);
      return;
    }

    console.log(`📊 Checking contributions for:`);
    console.log(`   Department: ${department.name} (${department.code || "N/A"})`);
    console.log(`   Department ID: ${departmentId}`);
    console.log(`   Year: ${year}\n`);

    // Find all contributions for this department and year
    const contributions = await Contribution.find({
      department: departmentId,
      year: parseInt(year, 10),
    })
      .populate("department", "name code")
      .populate("employee", "name empId")
      .populate("submittedBy", "name email")
      .sort({ cycle: 1, submittedAt: -1 })
      .lean();

    console.log(`📈 Found ${contributions.length} contribution(s):\n`);

    if (contributions.length === 0) {
      console.log("⚠️  No contributions found for this department and year.");
      console.log("\n💡 This could be why your dashboard shows 0 contributions.");
      console.log("   Make sure contributions exist with:");
      console.log(`   - department: ${departmentId}`);
      console.log(`   - year: ${year}`);
    } else {
      contributions.forEach((contrib, index) => {
        console.log(`${index + 1}. Cycle: ${contrib.cycle || "default"}`);
        console.log(`   Type: ${contrib.employee ? "Employee" : "Department"}`);
        if (contrib.employee) {
          console.log(`   Employee: ${contrib.employee.name} (${contrib.employee.empId})`);
        }
        console.log(`   Academy: ${contrib.academy}%`);
        console.log(`   Intensive: ${contrib.intensive}%`);
        console.log(`   NIAT: ${contrib.niat}%`);
        console.log(`   Submitted by: ${contrib.submittedBy.name} (${contrib.submittedBy.email})`);
        console.log(`   Submitted at: ${new Date(contrib.submittedAt).toLocaleString()}`);
        if (contrib.remarks) {
          console.log(`   Remarks: ${contrib.remarks}`);
        }
        console.log("");
      });
    }

    // Also check users assigned to this department
    console.log("\n👥 Users assigned to this department:");
    const hodUsers = await User.find({ department: departmentId })
      .select("name email role")
      .lean();
    
    if (hodUsers.length === 0) {
      console.log("   ⚠️  No users assigned to this department");
    } else {
      hodUsers.forEach((user) => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await disconnectDB();
    console.log("\n✅ Disconnected from database");
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const departmentId = args[0];
const year = args[1] || 2025;

checkContributions(departmentId, year);

