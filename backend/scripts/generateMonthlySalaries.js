require("dotenv").config();

const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("../src/config/db");
const { Employee } = require("../src/models/Employee");
const { MonthlySalary, MONTHS } = require("../src/models/MonthlySalary");

async function main() {
  const year = Number(process.env.MONTHLY_SALARY_YEAR) || new Date().getFullYear();

  await connectDB();

  try {
    const employees = await Employee.find().select("_id salary").lean();

    if (employees.length === 0) {
      console.log("No employees found. Nothing to do.");
      return;
    }

    const ops = [];
    const perEmployee = {};

    employees.forEach((employee) => {
      const monthlyAmount = Math.round((employee.salary || 0) / 12);

      MONTHS.forEach((month) => {
        ops.push({
          updateOne: {
            filter: {
              employee: employee._id,
              month,
              year,
            },
            update: {
              $set: {
                employee: employee._id,
                month,
                year,
                amount: monthlyAmount,
              },
            },
            upsert: true,
          },
        });
      });

      perEmployee[employee._id] = monthlyAmount;
    });

    if (ops.length === 0) {
      console.log("No monthly salaries to upsert.");
      return;
    }

    const result = await MonthlySalary.bulkWrite(ops, { ordered: false });

    console.log(`Processed ${employees.length} employee(s) for year ${year}.`);
    console.log(
      `Upserted ${result.upsertedCount || 0}, Modified ${result.modifiedCount || 0}, Matched ${result.matchedCount || 0}.`
    );
  } catch (error) {
    console.error("Failed to generate monthly salaries:", error);
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  mongoose.connection.close();
});
