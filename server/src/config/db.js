import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // 10 s — fail fast
    socketTimeoutMS: 45000,
  });

  const host = mongoose.connection.host;
  console.log(`✅ MongoDB connected: ${host}`);
};

export default connectDB;
