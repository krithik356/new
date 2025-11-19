require("dotenv").config();
const bcrypt = require("bcrypt");
const { connectDB, disconnectDB } = require("./config/db");
const { Department } = require("./models/Department");
const { User } = require("./models/User");
const { Employee } = require("./models/Employee");
const { Contribution } = require("./models/Contribution");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const departmentsSeed = [
  { name: "Tech", code: "TECH" },
  { name: "Design", code: "DES" },
  { name: "Marketing", code: "MKT" },
];

function generateRandomSalary() {
  const min = 35000;
  const max = 120000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  await connectDB();

  console.log("Clearing existing collections...");
  // Clear in order to avoid foreign key issues
  await Contribution.deleteMany({});
  await Employee.deleteMany({});
  await User.deleteMany({});
  await Department.deleteMany({});
  
  // Drop and recreate indexes to ensure they're clean
  try {
    await Contribution.collection.dropIndexes();
  } catch (error) {
    // Indexes might not exist yet, that's okay
    console.log("   Note: Indexes will be created automatically");
  }
  
  // Wait a bit to ensure everything is cleared
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log("Seeding departments...");
  const departments = await Department.insertMany(departmentsSeed);

  console.log("Creating users...");
  const adminPassword = await bcrypt.hash("Admin@123", SALT_ROUNDS);
  const adminUser = await User.create({
    name: "System Admin",
    email: "admin@organization.com",
    passwordHash: adminPassword,
    role: "Admin",
    department: null,
  });

  const hodUsers = [];
  for (const department of departments) {
    const passwordHash = await bcrypt.hash(
      `${department.code || "dept"}@123`,
      SALT_ROUNDS
    );
    const hod = await User.create({
      name: `${department.name} HOD`,
      email: `${(
        department.code || department.name
      ).toLowerCase()}_hod@organization.com`,
      passwordHash,
      role: "HOD",
      department: department._id,
    });
    department.hod = hod._id;
    await department.save();
    hodUsers.push(hod);
  }

  console.log("Seeding employees...");
  const employeeDocs = [];
  const firstNames = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
    "Sage", "River", "Blake", "Cameron", "Dakota", "Emery", "Finley", "Harper",
    "Hayden", "Jamie", "Kai", "Logan", "Noah", "Parker", "Phoenix", "Reese",
    "Rowan", "Skylar", "Spencer", "Tatum", "Willow", "Zion", "Aiden", "Brook",
    "Carter", "Drew", "Ellis", "Gray", "Haven", "Ivy", "Jade", "Kendall"
  ];
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
    "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "King",
    "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Nelson"
  ];

  const usedNames = new Set();
  const usedEmails = new Set();
  
  hodUsers.forEach((hod, index) => {
    const dept = departments[index];
    // Distribute 50 employees: 17, 17, 16
    const employeesPerDept = index === 0 ? 17 : index === 1 ? 17 : 16;
    const designations = dept.name === "Tech" 
      ? ["Senior Developer", "Developer", "Junior Developer", "Tech Lead", "Software Engineer"]
      : dept.name === "Design"
      ? ["Senior Designer", "Designer", "UI/UX Designer", "Design Lead", "Creative Director"]
      : ["Marketing Specialist", "Marketing Manager", "Content Manager", "Brand Manager", "Marketing Lead"];
    
    for (let i = 1; i <= employeesPerDept; i += 1) {
      let firstName, lastName, fullName, email;
      let attempts = 0;
      
      // Ensure unique names and emails
      do {
        firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        fullName = `${firstName} ${lastName}`;
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${dept.code.toLowerCase()}.org`;
        attempts++;
      } while ((usedNames.has(fullName) || usedEmails.has(email)) && attempts < 50);
      
      usedNames.add(fullName);
      usedEmails.add(email);
      
      const empId = `${dept.code || "DEPT"}-${String(i).padStart(3, "0")}`;
      
      employeeDocs.push({
        empId,
        name: fullName,
        department: dept._id,
        designation: designations[Math.floor(Math.random() * designations.length)],
        email,
        salary: generateRandomSalary(),
      });
    }
  });
  
  // Insert employees and get the actual documents with _id values
  const insertedEmployees = await Employee.insertMany(employeeDocs);

  // Update department employee counts
  for (let i = 0; i < departments.length; i += 1) {
    const dept = departments[i];
    const count = insertedEmployees.filter(emp => String(emp.department) === String(dept._id)).length;
    dept.employeesCount = count;
    await dept.save();
  }

  console.log("Seeding starter contributions...");
  const cycles = ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4"];
  const departmentContributionDocs = [];
  const employeeContributionDocs = [];
  
  // Create department-level contributions (one per department per cycle)
  departments.forEach((dept, deptIndex) => {
    cycles.forEach((cycle, cycleIndex) => {
      const baseAcademy = 35 + (cycleIndex * 2);
      const baseIntensive = 30 + (cycleIndex * 1);
      const baseNiat = 35 - (cycleIndex * 3);
      
      departmentContributionDocs.push({
        department: dept._id,
        employee: null, // Department-level contribution
        academy: baseAcademy,
        intensive: baseIntensive,
        niat: baseNiat,
        cycle,
        remarks: `${cycle} contribution allocation for ${dept.name}`,
        submittedBy: hodUsers[deptIndex]._id,
        submittedAt: new Date(Date.now() - (cycles.length - cycleIndex) * 30 * 24 * 60 * 60 * 1000),
      });
    });
  });
  
  // Insert department-level contributions first
  if (departmentContributionDocs.length > 0) {
    await Contribution.insertMany(departmentContributionDocs);
    console.log(`   ✓ Inserted ${departmentContributionDocs.length} department-level contributions`);
  }
  
  // Create employee-level contributions (one per employee per cycle) with random percentages
  insertedEmployees.forEach((employee, empIndex) => {
    cycles.forEach((cycle, cycleIndex) => {
      // Generate random percentages that sum to 100
      // Generate three random numbers between 20 and 50 for variety
      let academy = Math.floor(Math.random() * 30) + 20; // 20-50
      let intensive = Math.floor(Math.random() * 30) + 20; // 20-50
      let niat = Math.floor(Math.random() * 30) + 20; // 20-50
      
      // Normalize to sum to 100 (proportional scaling)
      const total = academy + intensive + niat;
      academy = (academy / total) * 100;
      intensive = (intensive / total) * 100;
      niat = (niat / total) * 100;
      
      // Round to integers
      academy = Math.round(academy);
      intensive = Math.round(intensive);
      niat = Math.round(niat);
      
      // Adjust to ensure exact sum of 100
      const currentSum = academy + intensive + niat;
      const diff = 100 - currentSum;
      
      // Add/subtract the difference to the largest value to minimize impact
      if (diff !== 0) {
        if (academy >= intensive && academy >= niat) {
          academy += diff;
        } else if (intensive >= academy && intensive >= niat) {
          intensive += diff;
        } else {
          niat += diff;
        }
      }
      
      // Final safety check - ensure all values are within 0-100
      academy = Math.max(0, Math.min(100, academy));
      intensive = Math.max(0, Math.min(100, intensive));
      niat = Math.max(0, Math.min(100, niat));
      
      // If sum still isn't 100, adjust niat
      const finalSum = academy + intensive + niat;
      if (finalSum !== 100) {
        niat = 100 - academy - intensive;
      }
      
      // Find the HOD for this employee's department
      const deptIndex = departments.findIndex(d => String(d._id) === String(employee.department));
      const submittedBy = deptIndex >= 0 ? hodUsers[deptIndex]._id : hodUsers[0]._id;
      
      employeeContributionDocs.push({
        department: employee.department,
        employee: employee._id,
        academy: Math.max(0, Math.min(100, academy)),
        intensive: Math.max(0, Math.min(100, intensive)),
        niat: Math.max(0, Math.min(100, niat)),
        cycle,
        remarks: `${cycle} contribution for ${employee.name} (${employee.empId})`,
        submittedBy: submittedBy,
        submittedAt: new Date(Date.now() - (cycles.length - cycleIndex) * 30 * 24 * 60 * 60 * 1000),
      });
    });
  });
  
  // Insert employee contributions one by one to handle unique index constraints
  let inserted = 0;
  let skipped = 0;
  for (const doc of employeeContributionDocs) {
    try {
      await Contribution.create(doc);
      inserted++;
      if (inserted % 50 === 0) {
        console.log(`   ✓ Inserted ${inserted}/${employeeContributionDocs.length} employee contributions...`);
      }
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - skip this contribution
        skipped++;
      } else {
        throw error;
      }
    }
  }
  if (skipped > 0) {
    console.log(`   ⚠ Skipped ${skipped} duplicate employee contributions`);
  }

  // Count contributions
  const employeeContributions = inserted; // Use actual inserted count
  const departmentContributions = departmentContributionDocs.length;
  const totalContributions = departmentContributions + employeeContributions;
  
  console.log("\n✅ Seed data created successfully!\n");
  console.log("📊 Summary:");
  console.log(`   - Departments: ${departments.length} (${departments.map(d => d.name).join(", ")})`);
  console.log(`   - Users: ${1 + hodUsers.length} (1 Admin + ${hodUsers.length} HODs)`);
  console.log(`   - Employees: ${insertedEmployees.length} total`);
  console.log(`   - Contributions: ${totalContributions} total`);
  console.log(`     • Department-level: ${departmentContributions} (${cycles.length} cycles × ${departments.length} departments)`);
  console.log(`     • Employee-level: ${employeeContributions} (${cycles.length} cycles × ${insertedEmployees.length} employees)`);
  if (skipped > 0) {
    console.log(`     ⚠ Skipped: ${skipped} duplicates\n`);
  } else {
    console.log();
  }
  
  console.log("🔐 Login Credentials:\n");
  console.log("   ADMINISTRATOR:");
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: Admin@123`);
  console.log(`   Role: ${adminUser.role}\n`);
  
  console.log("   HOD USERS:");
  hodUsers.forEach((hod, idx) => {
    console.log(`   ${departments[idx].name} Department:`);
    console.log(`   Email: ${hod.email}`);
    console.log(`   Password: ${departments[idx].code || "dept"}@123`);
    console.log(`   Role: ${hod.role}\n`);
  });
  
  console.log("📈 Employee Distribution:");
  departments.forEach((dept, idx) => {
    const count = insertedEmployees.filter(emp => String(emp.department) === String(dept._id)).length;
    console.log(`   ${dept.name}: ${count} employees`);
  });

  await disconnectDB();
}

run()
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
