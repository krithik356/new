const { app } = require("../src/server");
const { connectDB } = require("../src/config/db");

let dbReadyPromise = null;

async function ensureDatabaseConnection() {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }
  return dbReadyPromise;
}

module.exports = async function handler(req, res) {
  await ensureDatabaseConnection();
  return app(req, res);
};

