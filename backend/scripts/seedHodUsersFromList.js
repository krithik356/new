require("dotenv").config();

const bcrypt = require("bcrypt");
const { connectDB, disconnectDB } = require("../src/config/db");
const { Department } = require("../src/models/Department");
const { User } = require("../src/models/User");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

// Source Department, HOD name, Email (from your list)
const HOD_DEFINITIONS = [
  { departmentName: "Management", hodName: "Rahul Attuluri", email: "rahul@nxtwave.co.in" },
  { departmentName: "Sales", hodName: "G Sumanth Reddy", email: "sumanth@nxtwave.co.in" },
  { departmentName: "Pre-Sales", hodName: "Shiva Shanker Reddy Devasani", email: "shanker@nxtwave.co.in" },
  { departmentName: "Sales - Intensive", hodName: "Aniketh Reddy Mustoor", email: "aniketh@nxtwave.co.in" },
  { departmentName: "Placement - Corporate Relations", hodName: "Girish Akash", email: "girish@nxtwave.co.in" },
  { departmentName: "Student Success - Academy", hodName: "Vamshi Gadagoju", email: "vamshi@nxtwave.co.in" },
  { departmentName: "Student Success - Intensive", hodName: "Aniketh Reddy Mustoor", email: "aniketh@nxtwave.co.in" },
  { departmentName: "Placement Success Manager", hodName: "Vamsi Tallam", email: "vamsitallam@nxtwave.co.in" },
  { departmentName: "Query Resolution", hodName: "Vamsi Tallam", email: "vamsitallam@nxtwave.co.in" },
  { departmentName: "NIAT - Academics", hodName: "Vamsi Tallam", email: "vamsitallam@nxtwave.co.in" },
  { departmentName: "Video House", hodName: "Joiet Joseph", email: "joseph.joiet@nxtwave.co.in" },
  { departmentName: "PRE", hodName: "Anil Kumar Ganguri", email: "anil@nxtwave.co.in" },
  { departmentName: "Content - DS&ML", hodName: "Akhil Jogiparthi", email: "akhil@nxtwave.co.in" },
  { departmentName: "University Partnership", hodName: "Karthik Reddy V", email: "karthik@nxtwave.co.in" },
  { departmentName: "Talent Acquisition", hodName: "Hari Haran Gorijavola", email: "hari@nxtwave.co.in" },
  { departmentName: "Product", hodName: "Revanth Gopi Chowdary Konakanchi", email: "revanth@nxtwave.co.in" },
  { departmentName: "Business Ops", hodName: "Shivam Singh", email: "shivam.singh@nxtwave.co.in" },
  { departmentName: "Placement - Content", hodName: "Sai Teja Manchukanti", email: "saiteja@nxtwave.co.in" },
  { departmentName: "NIAT Masterclass", hodName: "Akhil Jogiparthi", email: "akhil@nxtwave.co.in" },
  { departmentName: "NIAT - Robotics", hodName: "Sai Teja Manchukanti", email: "saiteja@nxtwave.co.in" },
  { departmentName: "Content - DS&Algo", hodName: "Sashank Reddy Gujjula", email: "sashank@nxtwave.co.in" },
  { departmentName: "Student Success - NIAT", hodName: "Aniketh Reddy Mustoor", email: "aniketh@nxtwave.co.in" },
  { departmentName: "Human Resource", hodName: "Radha Alekhya Kommanaboina", email: "alekhya.k@nxtwave.co.in" },
  { departmentName: "NIAT - Program Ops", hodName: "Pavan Reddy Dharma", email: "pavan.dharma@nxtwave.co.in" },
  { departmentName: "Abroad", hodName: "Anil Kumar Ganguri", email: "anil@nxtwave.co.in" },
  { departmentName: "Founders Office", hodName: "Rahul Attuluri", email: "rahul@nxtwave.co.in" },
  { departmentName: "10xIIT", hodName: "Srikar", email: "srikar@nxtwave.co.in" },
  { departmentName: "NxtWave Edge - Colleges", hodName: "Sashank Reddy Gujjula", email: "sashank@nxtwave.co.in" },
  { departmentName: "Intensive Offline", hodName: "Aniketh Reddy Mustoor", email: "aniketh@nxtwave.co.in" },
  { departmentName: "Assessments POD", hodName: "Sashank Reddy Gujjula", email: "sashank@nxtwave.co.in" },
  { departmentName: "Internal Audit", hodName: "Radha Alekhya Kommanaboina", email: "alekhya.k@nxtwave.co.in" },
  { departmentName: "Finance", hodName: "Akhilesh Jhawar", email: "akhilesh.jhawar@nxtwave.in" },
  { departmentName: "GenAI Social Media", hodName: "Rahul Yenninti", email: "rahul.yenninti@nxtwave.co.in" },
  { departmentName: "AI&Beyond", hodName: "Srikar", email: "srikar@nxtwave.co.in" },
  { departmentName: "Content - MERN", hodName: "Pavan Gangireddy", email: "pavangangireddy@nxtwave.co.in" },
  { departmentName: "HR - Admin/Facilities", hodName: "Bala Bhaskar Reddy Dodda", email: "balabhaskar@nxtwave.co.in" },
  { departmentName: "Branding", hodName: "Nikita Aggarwal", email: "nikita.aggarwal@nxtwave.co.in" },
  { departmentName: "HR - Learning & Development", hodName: "Munagala Varun Reddy", email: "varun@nxtwave.co.in" },
  { departmentName: "Policy & Strategic Partnerships", hodName: "Radha Alekhya Kommanaboina", email: "alekhya.k@nxtwave.co.in" },
  { departmentName: "NIFA", hodName: "Akhil Jogiparthi", email: "akhil@nxtwave.co.in" },
  { departmentName: "Pre-Sales - Intensive", hodName: "Aniketh Reddy Mustoor", email: "aniketh@nxtwave.co.in" },
  { departmentName: "NIAT - Hiring team", hodName: "Vamsi Tallam", email: "vamsitallam@nxtwave.co.in" },
  { departmentName: "Masterclass", hodName: "Akhil Jogiparthi", email: "akhil@nxtwave.co.in" },
  { departmentName: "NxtGen LP", hodName: "Revanth Gopi Chowdary Konakanchi", email: "revanth@nxtwave.co.in" },
];

function generateSharedPassword() {
  // Simple strong-ish random password generator
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let pw = "";
  const length = 12;
  for (let i = 0; i < length; i += 1) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

async function run() {
  try {
    await connectDB();

    // Only consider departments that exist in DB
    const departmentNames = HOD_DEFINITIONS.map((d) => d.departmentName);
    const departments = await Department.find({
      name: { $in: departmentNames },
    }).lean();

    const deptByName = new Map();
    departments.forEach((d) => {
      deptByName.set(d.name, d);
    });

    const sharedPassword = generateSharedPassword();
    const passwordHash = await bcrypt.hash(sharedPassword, SALT_ROUNDS);

    const createdUsers = [];
    const skippedExistingUsers = [];
    const missingDepartments = [];

    for (const def of HOD_DEFINITIONS) {
      const dept = deptByName.get(def.departmentName);
      if (!dept) {
        missingDepartments.push(def.departmentName);
        // Skip if department isn't in DB
        continue;
      }

      const existingUser = await User.findOne({
        email: def.email.trim().toLowerCase(),
      });

      if (existingUser) {
        skippedExistingUsers.push({
          email: def.email,
          departmentName: def.departmentName,
          reason: "User with this email already exists",
        });
        continue;
      }

      const user = await User.create({
        name: def.hodName,
        email: def.email.trim().toLowerCase(),
        passwordHash,
        role: "HOD",
        department: dept._id,
      });

      // Also set department.hod reference
      await Department.updateOne(
        { _id: dept._id },
        { $set: { hod: user._id } }
      );

      createdUsers.push({
        email: user.email,
        name: user.name,
        departmentName: def.departmentName,
      });
    }

    console.log("=== HOD User Seeding Summary ===");
    console.log(`Total definitions: ${HOD_DEFINITIONS.length}`);
    console.log(`Departments found in DB: ${departments.length}`);
    console.log(`Users created: ${createdUsers.length}`);
    console.log(`Users skipped (already existed): ${skippedExistingUsers.length}`);
    console.log(`Departments missing in DB: ${missingDepartments.length}`);

    if (createdUsers.length > 0) {
      console.log("\nCreated HOD users:");
      createdUsers.forEach((u) => {
        console.log(`  - ${u.name} (${u.email}) -> ${u.departmentName}`);
      });
    }

    if (skippedExistingUsers.length > 0) {
      console.log("\nSkipped (already existing emails):");
      skippedExistingUsers.forEach((u) => {
        console.log(`  - ${u.email} -> ${u.departmentName} (${u.reason})`);
      });
    }

    if (missingDepartments.length > 0) {
      console.log("\nDefinitions with missing Department documents:");
      missingDepartments.forEach((name) => {
        console.log(`  - ${name}`);
      });
    }

    console.log("\n=== SHARED PASSWORD FOR ALL *NEW* HOD USERS ===");
    console.log(sharedPassword);
  } catch (err) {
    console.error("Error while seeding HOD users:", err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

run();


