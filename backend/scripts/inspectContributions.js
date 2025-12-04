/**
 * Inspect the actual structure of contributions to see department field format
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { Contribution } = require("../src/models/Contribution");
const { connectDB, disconnectDB } = require("../src/config/db");

async function inspectContributions() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Get a few sample contributions without populate to see raw data
    const sampleContribs = await Contribution.find({})
      .limit(5)
      .lean();

    console.log("📋 Sample Contributions (Raw Structure):");
    console.log("=" .repeat(80));
    
    sampleContribs.forEach((contrib, idx) => {
      console.log(`\n${idx + 1}. Contribution ID: ${contrib._id}`);
      console.log(`   Department (raw): ${contrib.department}`);
      console.log(`   Department type: ${typeof contrib.department}`);
      console.log(`   Department is ObjectId: ${contrib.department instanceof mongoose.Types.ObjectId}`);
      console.log(`   Year: ${contrib.year}`);
      console.log(`   Cycle: ${contrib.cycle}`);
      console.log(`   Employee: ${contrib.employee || 'null'}`);
      console.log(`   Academy: ${contrib.academy}%`);
      console.log(`   Intensive: ${contrib.intensive}%`);
      console.log(`   NIAT: ${contrib.niat}%`);
    });

    // Check if department field exists and its types
    console.log("\n\n🔍 Department Field Analysis:");
    console.log("=" .repeat(80));
    
    const withDept = await Contribution.countDocuments({ department: { $exists: true, $ne: null } });
    const withoutDept = await Contribution.countDocuments({ department: null });
    const deptAsString = await Contribution.countDocuments({ 
      department: { $type: "string" } 
    });
    const deptAsObjectId = await Contribution.countDocuments({ 
      department: { $type: "objectId" } 
    });

    console.log(`Total contributions: ${await Contribution.countDocuments({})}`);
    console.log(`With department field: ${withDept}`);
    console.log(`Without department (null): ${withoutDept}`);
    console.log(`Department as string: ${deptAsString}`);
    console.log(`Department as ObjectId: ${deptAsObjectId}`);

    // Try to find contributions with the specific department ID
    const targetDeptId = "693027431450bfa60f52a4a7";
    console.log(`\n\n🎯 Searching for contributions with department: ${targetDeptId}`);
    console.log("=" .repeat(80));
    
    // Try as ObjectId
    let contribsAsObjectId = await Contribution.find({
      department: new mongoose.Types.ObjectId(targetDeptId)
    }).lean();
    console.log(`As ObjectId: ${contribsAsObjectId.length} found`);

    // Try as string
    let contribsAsString = await Contribution.find({
      department: targetDeptId
    }).lean();
    console.log(`As string: ${contribsAsString.length} found`);

    // Get all unique department values
    console.log("\n\n📊 All Unique Department Values in Contributions:");
    console.log("=" .repeat(80));
    const allContribs = await Contribution.find({})
      .select("department")
      .lean();
    
    const uniqueDepts = new Set();
    allContribs.forEach(c => {
      if (c.department) {
        uniqueDepts.add(c.department.toString());
      }
    });

    console.log(`Found ${uniqueDepts.size} unique department ID(s):`);
    Array.from(uniqueDepts).slice(0, 10).forEach((deptId, idx) => {
      console.log(`  ${idx + 1}. ${deptId}`);
      if (deptId === targetDeptId) {
        console.log(`      ✅ This matches your query!`);
      }
    });

    if (uniqueDepts.size > 10) {
      console.log(`  ... and ${uniqueDepts.size - 10} more`);
    }

    // Check if target department ID is in the list
    if (uniqueDepts.has(targetDeptId)) {
      console.log(`\n✅ Your department ID IS in the contributions!`);
      const matching = await Contribution.find({
        department: new mongoose.Types.ObjectId(targetDeptId),
        year: 2025
      }).lean();
      console.log(`   Found ${matching.length} contribution(s) for this department and year 2025`);
    } else {
      console.log(`\n❌ Your department ID is NOT in the contributions!`);
      console.log(`   This is why the query returns 0 results.`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await disconnectDB();
    console.log("\n✅ Disconnected from database");
  }
}

inspectContributions();

