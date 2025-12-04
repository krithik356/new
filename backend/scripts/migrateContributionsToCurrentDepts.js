/**
 * Migrate contributions from old/deleted departments to current departments
 * This will map old department IDs to new ones
 * 
 * WARNING: This will modify your database. Make a backup first!
 * Usage: node scripts/migrateContributionsToCurrentDepts.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { Contribution } = require("../src/models/Contribution");
const { Department } = require("../src/models/Department");
const { connectDB, disconnectDB } = require("../src/config/db");

async function migrateContributions() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Old department IDs that have contributions
    const oldDeptIds = [
      "693025a4ed290bbc886cbbd8",
      "693025a4ed290bbc886cbbd9",
      "693025a4ed290bbc886cbbda"
    ];

    // Get all current departments
    const currentDepts = await Department.find({}).select("_id name code").lean();
    
    console.log("📋 Current Departments Available:");
    currentDepts.forEach((dept, idx) => {
      console.log(`  ${idx + 1}. ${dept.name} ${dept.code ? `(${dept.code})` : ''} - ID: ${dept._id}`);
    });

    console.log("\n\n⚠️  MIGRATION OPTIONS:");
    console.log("=" .repeat(80));
    console.log("\nOption 1: Map all old contributions to 'Tech' department");
    console.log("Option 2: Map old contributions to specific departments (manual mapping)");
    console.log("Option 3: Just show what would be migrated (dry run)");
    
    console.log("\n\n🔍 Current Situation:");
    console.log("=" .repeat(80));
    
    for (const oldDeptId of oldDeptIds) {
      const count = await Contribution.countDocuments({ department: oldDeptId });
      console.log(`\nOld Department ID: ${oldDeptId}`);
      console.log(`  Contributions: ${count}`);
      
      // Check if this department still exists
      const dept = await Department.findById(oldDeptId).lean();
      if (dept) {
        console.log(`  ✅ Department still exists: ${dept.name}`);
      } else {
        console.log(`  ❌ Department NOT FOUND (was deleted)`);
      }
    }

    console.log("\n\n💡 RECOMMENDATION:");
    console.log("=" .repeat(80));
    console.log("Since the old departments don't exist, you have two options:");
    console.log("\n1. CREATE NEW CONTRIBUTIONS:");
    console.log("   - Use the app/API to create contributions for your current departments");
    console.log("   - This is the safest option");
    console.log("\n2. MIGRATE OLD CONTRIBUTIONS:");
    console.log("   - Update old contributions to point to current department IDs");
    console.log("   - Example: Map all to 'Tech' department");
    console.log("   - WARNING: This modifies historical data");

    console.log("\n\nTo migrate, uncomment and modify the code below:");
    console.log("=" .repeat(80));
    console.log(`
    // Example: Map all old contributions to Tech department
    const techDeptId = "693027431450bfa60f52a4a7"; // Tech
    
    for (const oldDeptId of oldDeptIds) {
      const result = await Contribution.updateMany(
        { department: oldDeptId },
        { $set: { department: new mongoose.Types.ObjectId(techDeptId) } }
      );
      console.log(\`Migrated \${result.modifiedCount} contributions from \${oldDeptId} to Tech\`);
    }
    `);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await disconnectDB();
    console.log("\n✅ Disconnected from database");
  }
}

migrateContributions();

