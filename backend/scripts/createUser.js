#!/usr/bin/env node
/* eslint-disable no-console */
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const { connectDB, disconnectDB } = require("../src/config/db");
const { User } = require("../src/models/User");

const ROLES = ["Admin", "HOD", "DataFiller"];

function parseArgs(argv) {
  const args = {};
  argv.forEach((arg) => {
    const [key, value] = arg.split("=");
    if (key && value) {
      const normalizedKey = key.replace(/^--/, "").trim();
      args[normalizedKey] = value.trim();
    }
  });
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const name = args.name || args.n;
  const email = args.email || args.e;
  const password = args.password || args.pw || args.p;
  const role = (args.role || "Admin").trim();
  const department = args.department || args.dept || args.d;

  if (!name || !email || !password) {
    console.error(
      "Usage: npm run create-user -- --name=\"Full Name\" --email=user@example.com --password=Secret123 [--role=Admin|HOD|DataFiller] [--department=<departmentId>]"
    );
    process.exit(1);
  }

  if (!ROLES.includes(role)) {
    console.error(`Role must be one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  if ((role === "HOD" || role === "DataFiller") && !department) {
    console.error(`${role} accounts require a --department=<departmentId> value.`);
    process.exit(1);
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      console.error("❌ User with this email already exists.");
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS || 10)
    );

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      department: role === "HOD" || role === "DataFiller" ? department : null,
    });

    console.log("✅ User created successfully:");
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch (error) {
    console.error("❌ Failed to create user:", error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

main();

