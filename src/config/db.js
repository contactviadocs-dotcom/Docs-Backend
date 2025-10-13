import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,     // ensures new Mongo parser is used
      useUnifiedTopology: true,  // uses new Mongo server discovery engine
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // stop server if DB fails
  }
};

export default connectDB;
