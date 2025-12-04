/**
 * Debug script to investigate why contributions aren't showing
 * This will show what department IDs and years actually exist in contributions
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { Contribution } = require("../src/models/Contribution");
const { Department } = require("../src/models/Department");
const { User } = require("../src/models/User");
const { connectDB, disconnectDB } = require("../src/config/db");

async function debugContributions() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Get all unique department IDs in contributions
    console.log("📊 Analyzing contributions collection...\n");
    
    const allContributions = await Contribution.find({})
      .select("department year cycle employee")
      .populate("department", "name code")
      .lean();

    console.log(`Total contributions in database: ${allContributions.length}\n`);

    // Group by department
    const byDepartment = {};
    const byYear = {};
    
    allContributions.forEach(contrib => {
      const deptId = contrib.department?._id?.toString() || contrib.department?.toString() || 'unknown';
      const deptName = contrib.department?.name || 'Unknown';
      const year = contrib.year || 'unknown';
      
      if (!byDepartment[deptId]) {
        byDepartment[deptId] = {
          name: deptName,
          code: contrib.department?.code,
          years: new Set(),
          count: 0
        };
      }
      byDepartment[deptId].years.add(year);
      byDepartment[deptId].count++;
      
      if (!byYear[year]) {
        byYear[year] = 0;
      }
      byYear[year]++;
    });

    console.log("📋 Contributions by Department:");
    console.log("=" .repeat(80));
    Object.entries(byDepartment).forEach(([deptId, data]) => {
      const years = Array.from(data.years).sort();
      console.log(`\nDepartment: ${data.name} ${data.code ? `(${data.code})` : ''}`);
      console.log(`  ID: ${deptId}`);
      console.log(`  Total contributions: ${data.count}`);
      console.log(`  Years: ${years.join(', ')}`);
      if (years.includes(2025)) {
        const count2025 = allContributions.filter(c => 
          (c.department?._id?.toString() || c.department?.toString()) === deptId && c.year === 2025
        ).length;
        console.log(`  ✅ Has ${count2025} contribution(s) for year 2025`);
      } else {
        console.log(`  ⚠️  No contributions for year 2025`);
      }
    });

    console.log("\n\n📅 Contributions by Year:");
    console.log("=" .repeat(80));
    Object.entries(byYear)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([year, count]) => {
        console.log(`  ${year}: ${count} contribution(s)`);
      });

    // Check the specific department ID from the query
    const queryDeptId = "693027431450bfa60f52a4a7";
    console.log(`\n\n🔍 Checking department ID from your query: ${queryDeptId}`);
    console.log("=" .repeat(80));
    
    const dept = await Department.findById(queryDeptId).lean();
    if (dept) {
      console.log(`✅ Department found: ${dept.name} ${dept.code ? `(${dept.code})` : ''}`);
      
      const contribsForDept = await Contribution.find({
        department: queryDeptId
      })
        .select("year cycle employee academy intensive niat")
        .populate("employee", "name")
        .sort({ year: 1, cycle: 1 })
        .lean();
      
      console.log(`\nContributions for this department: ${contribsForDept.length}`);
      
      if (contribsForDept.length === 0) {
        console.log("⚠️  No contributions found for this department at all!");
      } else {
        const byYearForDept = {};
        contribsForDept.forEach(c => {
          if (!byYearForDept[c.year]) {
            byYearForDept[c.year] = [];
          }
          byYearForDept[c.year].push(c);
        });
        
        Object.entries(byYearForDept)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .forEach(([year, contribs]) => {
            console.log(`\n  Year ${year}: ${contribs.length} contribution(s)`);
            contribs.forEach((c, idx) => {
              console.log(`    ${idx + 1}. Cycle: ${c.cycle || 'default'}, Type: ${c.employee ? 'Employee' : 'Department'}, Academy: ${c.academy}%, Intensive: ${c.intensive}%, NIAT: ${c.niat}%`);
            });
          });
        
        if (!byYearForDept[2025]) {
          console.log(`\n⚠️  No contributions found for year 2025 for this department!`);
          console.log(`   Available years: ${Object.keys(byYearForDept).join(', ')}`);
        }
      }
    } else {
      console.log(`❌ Department NOT found with ID: ${queryDeptId}`);
      console.log(`\nThis might be the issue - the department ID doesn't exist!`);
    }

    // Check users assigned to this department
    if (dept) {
      console.log(`\n\n👥 Users assigned to department "${dept.name}":`);
      const users = await User.find({ department: queryDeptId })
        .select("name email role")
        .lean();
      
      if (users.length === 0) {
        console.log("  ⚠️  No users assigned to this department");
      } else {
        users.forEach(u => {
          console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await disconnectDB();
    console.log("\n✅ Disconnected from database");
  }
}

debugContributions();

