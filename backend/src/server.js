require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const departmentRoutes = require("./routes/department.routes");
const employeeRoutes = require("./routes/employee.routes");
const contributionRoutes = require("./routes/contribution.routes");
const exportRoutes = require("./routes/export.routes");

const { connectDB, disconnectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5001;
const isServerless = Boolean(process.env.VERCEL);

// Disable ETag to prevent 304 responses
app.set("etag", false);

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000", // Alternative frontend port
  process.env.CORS_ORIGIN, // Environment variable override
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // For development, allow all origins
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // Reject in production if not in allowed list
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running", timestamp: new Date().toISOString() });
});

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

// Disable caching for API responses (ensure fresh data)
app.use((req, res, next) => {
  // Disable caching for all API routes
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0",
  });
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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

// 404 handler - must be after all routes
app.use(notFound);

// Error handling middleware - must be last
app.use(errorHandler);

// Start server with database connection
async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
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

// Start server if not in test environment or serverless deployment
if (process.env.NODE_ENV !== "test" && !isServerless) {
  startServer();
}

module.exports = { app, startServer };
