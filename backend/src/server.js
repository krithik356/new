require("dotenv").config();
const express = require("express");
const net = require("net");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const departmentRoutes = require("./routes/department.routes");
const employeeRoutes = require("./routes/employee.routes");
const contributionRoutes = require("./routes/contribution.routes");
const exportRoutes = require("./routes/export.routes");
const newJoineePayrollRoutes = require("./routes/newJoineePayroll.routes");
const existingEmployeePayrollRoutes = require("./routes/existingEmployeePayroll.routes");

const { connectDB, disconnectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5001;
const isServerless = Boolean(process.env.VERCEL);

// Disable ETag
app.set("etag", false);

// ✅ CORS — Allow ALL origins
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // allow everything
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Base route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Employee Contribution API",
    docs: "/api/health",
  });
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// Disable caching for API responses
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });
  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("dev", {
      skip: () => process.env.NODE_ENV === "production",
    })
  );
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/contributions/export", exportRoutes);
app.use("/api/payroll/new-joinees", newJoineePayrollRoutes);
app.use("/api/payroll/existing-employees", existingEmployeePayrollRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once("listening", () => {
        tester
          .close(() => {
            resolve(true);
          })
          .on("error", reject);
      })
      .listen(port, "0.0.0.0");
  });
}

async function findOpenPort(startPort, attempts = 5) {
  let port = startPort;
  for (let i = 0; i < attempts; i += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port += 1;
  }

  throw new Error(
    `No available ports found between ${startPort} and ${port - 1}.`
  );
}

// Start server
async function startServer() {
  try {
    await connectDB();

    let resolvedPort = DEFAULT_PORT;
    try {
      resolvedPort = await findOpenPort(DEFAULT_PORT);
      if (resolvedPort !== DEFAULT_PORT) {
        console.warn(
          `⚠️  Port ${DEFAULT_PORT} is busy. Switched to available port ${resolvedPort}.`
        );
      }
    } catch (portError) {
      console.error("❌ Unable to find an open port:", portError.message);
      process.exit(1);
    }

    const server = app.listen(resolvedPort, () => {
      console.log(`🚀 Server running on port ${resolvedPort}`);
      console.log(
        `📍 Health check: http://localhost:${resolvedPort}/api/health`
      );
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("\n🛑 Shutting down gracefully...");
      server.close(async () => {
        await disconnectDB();
        console.log("✅ Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Run server only when not serverless
if (process.env.NODE_ENV !== "test" && !isServerless) {
  startServer();
}

module.exports = { app, startServer };
