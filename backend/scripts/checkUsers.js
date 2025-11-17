require("dotenv").config();
const { connectDB, disconnectDB } = require("../src/config/db");
const { User } = require("../src/models/User");

async function checkUsers() {
  try {
    await connectDB();
    const users = await User.find().select("email role name department");
    console.log("\n📋 Users in database:");
    console.log("=".repeat(60));
    if (users.length === 0) {
      console.log("  No users found. Run 'npm run seed' to create users.");
    } else {
      users.forEach((u) => {
        console.log(`  Email: ${u.email}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Name: ${u.name}`);
        console.log(`  Department: ${u.department || "None"}`);
        console.log("-".repeat(60));
      });
    }
    await disconnectDB();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUsers();

