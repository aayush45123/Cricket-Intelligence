import mongoose from "mongoose";

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri =
    process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/cricket-intelligence";

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("⚠️ Primary MongoDB Connection Failed:", error.message);

    if (fallbackUri && primaryUri !== fallbackUri) {
      try {
        console.log(`🔄 Attempting fallback connection to: ${fallbackUri}`);
        const conn = await mongoose.connect(fallbackUri);
        console.log(` MongoDB Connected (Fallback): ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(" Fallback Connection Failed:", fallbackError.message);
      }
    }

    console.error("\n=======================================================");
    console.error("❌ MONGODB ATLAS CONNECTION ISSUE DETECTED!");
    console.error("Your current IP address is not whitelisted in MongoDB Atlas.");
    console.error("\n📌 HOW TO FIX THIS:");
    console.error("1. Go to MongoDB Atlas (https://cloud.mongodb.com/)");
    console.error("2. Navigate to Network Access under Security");
    console.error("3. Click 'Add IP Address'");
    console.error("4. Click 'Add Current IP Address' (or allow '0.0.0.0/0' for development)");
    console.error("5. Save changes — database will auto-reconnect!");
    console.error("=======================================================\n");

    // Retry connection in background without killing Express server
    setTimeout(connectDB, 15000);
  }
};

export default connectDB;
