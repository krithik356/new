import mongoose from 'mongoose';

const DEFAULT_URI =
  process.env.MONGO_URI ??
  'mongodb+srv://podichettykrithik_db_user:krithu2006@cluster0.gxtvdjh.mongodb.net/';

export async function connectDB(uri = DEFAULT_URI) {
  if (!uri) {
    throw new Error('MongoDB connection string is missing. Set MONGO_URI in your environment.');
  }

  // If already connected, do nothing
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB is already connected.');
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB ?? undefined,
    });

    // Event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected.');
    });

    // Additional check
    if (mongoose.connection.readyState === 1) {
      console.log('🔥 MongoDB connection established & ready.');
    } else {
      console.log('⚠️ MongoDB connection state:', mongoose.connection.readyState);
    }

    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected manually.');
  }
}
