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
  // Handle CORS preflight requests before connecting to DB
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }

  await ensureDatabaseConnection();
  return app(req, res);
};

