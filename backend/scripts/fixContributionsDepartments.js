/**
 * Fix contributions department IDs to match current Tech, Marketing, and Design departments
 * This will update old department IDs to the current ones
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { Contribution } = require("../src/models/Contribution");
const { Department } = require("../src/models/Department");
const { connectDB, disconnectDB } = require("../src/config/db");

async function fixContributions() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Old department IDs that have contributions
    const oldDeptIds = [
      "693025a4ed290bbc886cbbd8",
      "693025a4ed290bbc886cbbd9",
      "693025a4ed290bbc886cbbda"
    ];

    // Current department IDs
    const techDeptId = "693027431450bfa60f52a4a7"; // Tech
    const marketingDeptId = "693027431450bfa60f52a4a9"; // Marketing
    const designDeptId = "693027431450bfa60f52a4a8"; // Design

    // Verify current departments exist
    console.log("🔍 Verifying current departments...");
    const techDept = await Department.findById(techDeptId).lean();
    const marketingDept = await Department.findById(marketingDeptId).lean();
    const designDept = await Department.findById(designDeptId).lean();

    if (!techDept || !marketingDept || !designDept) {
      console.error("❌ One or more departments not found!");
      if (!techDept) console.error(`   Tech not found: ${techDeptId}`);
      if (!marketingDept) console.error(`   Marketing not found: ${marketingDeptId}`);
      if (!designDept) console.error(`   Design not found: ${designDeptId}`);
      return;
    }

    console.log(`✅ Tech: ${techDept.name} (${techDept.code || 'N/A'})`);
    console.log(`✅ Marketing: ${marketingDept.name} (${marketingDept.code || 'N/A'})`);
    console.log(`✅ Design: ${designDept.name} (${designDept.code || 'N/A'})\n`);

    // Check current contribution counts for old departments
    console.log("📊 Current contribution counts for old departments:");
    console.log("=" .repeat(80));
    
    const counts = {};
    for (const oldDeptId of oldDeptIds) {
      const count = await Contribution.countDocuments({ department: oldDeptId });
      counts[oldDeptId] = count;
      console.log(`  ${oldDeptId}: ${count} contribution(s)`);
    }

    // Map old IDs to new IDs
    // We'll distribute them evenly: first old ID -> Tech, second -> Marketing, third -> Design
    const mapping = [
      { old: oldDeptIds[0], new: techDeptId, name: "Tech" },
      { old: oldDeptIds[1], new: marketingDeptId, name: "Marketing" },
      { old: oldDeptIds[2], new: designDeptId, name: "Design" }
    ];

    console.log("\n\n🔄 Migration Plan:");
    console.log("=" .repeat(80));
    mapping.forEach((map, idx) => {
      console.log(`\n${idx + 1}. ${map.name}:`);
      console.log(`   Old ID: ${map.old} (${counts[map.old]} contributions)`);
      console.log(`   New ID: ${map.new}`);
    });

    // Perform the migration
    console.log("\n\n🚀 Starting migration...");
    console.log("=" .repeat(80));

    let totalMigrated = 0;
    for (const map of mapping) {
      const result = await Contribution.updateMany(
        { department: new mongoose.Types.ObjectId(map.old) },
        { $set: { department: new mongoose.Types.ObjectId(map.new) } }
      );
      
      console.log(`\n✅ ${map.name}:`);
      console.log(`   Migrated ${result.modifiedCount} contribution(s)`);
      console.log(`   Matched ${result.matchedCount} document(s)`);
      
      totalMigrated += result.modifiedCount;
    }

    console.log(`\n\n✨ Migration Complete!`);
    console.log("=" .repeat(80));
    console.log(`Total contributions migrated: ${totalMigrated}`);

    // Verify the migration
    console.log("\n\n🔍 Verification:");
    console.log("=" .repeat(80));
    
    const techCount = await Contribution.countDocuments({ department: techDeptId });
    const marketingCount = await Contribution.countDocuments({ department: marketingDeptId });
    const designCount = await Contribution.countDocuments({ department: designDeptId });
    
    console.log(`Tech contributions: ${techCount}`);
    console.log(`Marketing contributions: ${marketingCount}`);
    console.log(`Design contributions: ${designCount}`);
    console.log(`Total: ${techCount + marketingCount + designCount}`);

    // Check if any old IDs still exist
    console.log("\n\n🧹 Checking for remaining old department IDs...");
    let remainingOld = 0;
    for (const oldDeptId of oldDeptIds) {
      const count = await Contribution.countDocuments({ department: oldDeptId });
      if (count > 0) {
        console.log(`⚠️  Still ${count} contribution(s) with old ID: ${oldDeptId}`);
        remainingOld += count;
      }
    }
    
    if (remainingOld === 0) {
      console.log("✅ All old department IDs have been migrated!");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await disconnectDB();
    console.log("\n✅ Disconnected from database");
  }
}

fixContributions();

