/**
 * Find the department mismatch - which departments have contributions vs which department the user is assigned to
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { Contribution } = require("../src/models/Contribution");
const { Department } = require("../src/models/Department");
const { User } = require("../src/models/User");
const { connectDB, disconnectDB } = require("../src/config/db");

async function findMismatch() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Get all departments that have contributions
    const contribs = await Contribution.find({})
      .select("department")
      .lean();
    
    const deptIdsInContribs = [...new Set(contribs.map(c => c.department.toString()))];
    
    console.log("📊 Departments with Contributions:");
    console.log("=" .repeat(80));
    
    for (const deptId of deptIdsInContribs) {
      const dept = await Department.findById(deptId).lean();
      const count = contribs.filter(c => c.department.toString() === deptId).length;
      
      if (dept) {
        console.log(`\n✅ ${dept.name} ${dept.code ? `(${dept.code})` : ''}`);
        console.log(`   ID: ${deptId}`);
        console.log(`   Contributions: ${count}`);
      } else {
        console.log(`\n⚠️  Department ID ${deptId} NOT FOUND in departments collection!`);
        console.log(`   Contributions: ${count}`);
        console.log(`   ⚠️  This department may have been deleted!`);
      }
    }

    // Check the user's assigned department
    const userDeptId = "693027431450bfa60f52a4a7";
    console.log(`\n\n👤 Your Assigned Department:`);
    console.log("=" .repeat(80));
    
    const userDept = await Department.findById(userDeptId).lean();
    if (userDept) {
      console.log(`✅ ${userDept.name} ${userDept.code ? `(${userDept.code})` : ''}`);
      console.log(`   ID: ${userDeptId}`);
      
      const hasContribs = deptIdsInContribs.includes(userDeptId);
      if (hasContribs) {
        const count = contribs.filter(c => c.department.toString() === userDeptId).length;
        console.log(`   ✅ Has ${count} contribution(s)`);
      } else {
        console.log(`   ❌ Has NO contributions!`);
        console.log(`\n   💡 SOLUTION: Contributions exist for other departments, not yours.`);
        console.log(`   You need to either:`);
        console.log(`   1. Create contributions for department "${userDept.name}"`);
        console.log(`   2. Or reassign your user account to one of the departments that has contributions`);
      }
    } else {
      console.log(`❌ Department ID ${userDeptId} NOT FOUND!`);
    }

    // List all departments
    console.log(`\n\n📋 All Departments in Database:`);
    console.log("=" .repeat(80));
    const allDepts = await Department.find({}).select("_id name code").lean();
    allDepts.forEach(dept => {
      const hasContribs = deptIdsInContribs.includes(dept._id.toString());
      const marker = hasContribs ? "✅" : "❌";
      console.log(`${marker} ${dept.name} ${dept.code ? `(${dept.code})` : ''} - ID: ${dept._id}`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await disconnectDB();
    console.log("\n✅ Disconnected from database");
  }
}

findMismatch();

