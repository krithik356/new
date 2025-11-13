require("dotenv").config();
const mongoose = require("mongoose");

const DEFAULT_URI =
  "mongodb+srv://podichettykrithik_db_user:krithu2006@cluster0.gxtvdjh.mongodb.net/";

// Get connection URI from environment or use default
function getConnectionURI() {
  const envURI = process.env.MONGO_URI;

  // Check if MONGO_URI is set and is a valid non-empty string
  if (envURI && typeof envURI === "string" && envURI.trim().length > 0) {
    // Validate that it starts with mongodb:// or mongodb+srv://
    if (
      envURI.startsWith("mongodb://") ||
      envURI.startsWith("mongodb+srv://")
    ) {
      return envURI.trim();
    } else {
      console.warn(
        "⚠️ MONGO_URI does not start with 'mongodb://' or 'mongodb+srv://'. Using default URI."
      );
      return DEFAULT_URI;
    }
  }

  return DEFAULT_URI;
}

async function connectDB(uri = null) {
  // Use provided URI, or get from environment/default
  const connectionURI = uri || getConnectionURI();

  if (!connectionURI || connectionURI.trim().length === 0) {
    throw new Error(
      "MongoDB connection string is missing. Set MONGO_URI in your environment."
    );
  }

  // Validate connection string format
  if (
    !connectionURI.startsWith("mongodb://") &&
    !connectionURI.startsWith("mongodb+srv://")
  ) {
    throw new Error(
      'Invalid MongoDB connection string. Must start with "mongodb://" or "mongodb+srv://"'
    );
  }

  // If already connected, do nothing
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB is already connected.");
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(connectionURI, {
      dbName: process.env.MONGODB_DB || undefined,
    });

    // Event listeners
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected.");
    });

    // Additional check
    if (mongoose.connection.readyState === 1) {
      console.log("🔥 MongoDB connection established & ready.");
    } else {
      console.log(
        "⚠️ MongoDB connection state:",
        mongoose.connection.readyState
      );
    }

    return mongoose.connection;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    throw error;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected manually.");
  }
}

module.exports = { connectDB, disconnectDB };
