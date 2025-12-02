require("dotenv").config();
const mongoose = require("mongoose");

/**
 * Default MongoDB connection URI (fallback if environment variable is not set)
 * This should ideally be moved to environment variables for security
 */
const DEFAULT_URI =
  "mongodb+srv://podichettykrithik_db_user:krithu2006@cluster0.gxtvdjh.mongodb.net/";

/**
 * Retrieves the MongoDB connection URI from environment variables or uses the default
 * Validates that the URI is properly formatted before returning it
 * 
 * @returns {string} The MongoDB connection URI
 */
function getConnectionURI() {
  const environmentURI = process.env.MONGO_URI;

  // Check if MONGO_URI is set and is a valid non-empty string
  if (environmentURI && typeof environmentURI === "string" && environmentURI.trim().length > 0) {
    // Validate that it starts with mongodb:// or mongodb+srv://
    const isValidMongoURI = 
      environmentURI.startsWith("mongodb://") ||
      environmentURI.startsWith("mongodb+srv://");
    
    if (isValidMongoURI) {
      return environmentURI.trim();
    } else {
      console.warn(
        "⚠️ MONGO_URI does not start with 'mongodb://' or 'mongodb+srv://'. Using default URI."
      );
      return DEFAULT_URI;
    }
  }

  return DEFAULT_URI;
}

/**
 * Establishes a connection to MongoDB database
 * If already connected, returns the existing connection
 * Sets up event listeners for connection lifecycle events
 * 
 * @param {string|null} uri - Optional MongoDB connection URI. If not provided, uses environment variable or default
 * @returns {Promise<mongoose.Connection>} The MongoDB connection object
 * @throws {Error} If connection string is invalid or connection fails
 */
async function connectDB(uri = null) {
  // Use provided URI, or get from environment/default
  const connectionURI = uri || getConnectionURI();

  // Validate that we have a connection string
  if (!connectionURI || connectionURI.trim().length === 0) {
    throw new Error(
      "MongoDB connection string is missing. Set MONGO_URI in your environment."
    );
  }

  // Validate connection string format
  const isValidFormat = 
    connectionURI.startsWith("mongodb://") ||
    connectionURI.startsWith("mongodb+srv://");
  
  if (!isValidFormat) {
    throw new Error(
      'Invalid MongoDB connection string. Must start with "mongodb://" or "mongodb+srv://"'
    );
  }

  // If already connected, return existing connection
  const isAlreadyConnected = mongoose.connection.readyState === 1;
  if (isAlreadyConnected) {
    console.log("MongoDB is already connected.");
    return mongoose.connection;
  }

  // Enable strict query mode to prevent deprecated query syntax
  mongoose.set("strictQuery", true);

  try {
    // Connect to MongoDB with optional database name from environment
    await mongoose.connect(connectionURI, {
      dbName: process.env.MONGODB_DB || undefined,
    });

    // Set up event listeners for connection lifecycle
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully.");
    });

    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected.");
    });

    // Verify connection state after connection attempt
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

/**
 * Gracefully disconnects from MongoDB database
 * Only disconnects if currently connected (prevents errors on already disconnected state)
 * 
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  const isCurrentlyConnected = mongoose.connection.readyState !== 0;
  if (isCurrentlyConnected) {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected manually.");
  }
}

module.exports = { connectDB, disconnectDB };
