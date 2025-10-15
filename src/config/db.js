import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI not set in environment (.env). Please add your MongoDB connection string.");
    process.exit(1);
  }

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Provide a few connection tuning options to improve latency and
      // connection stability for Atlas. poolSize controls max simultaneous
      // connections, serverSelectionTimeoutMS makes failures surface faster.
      await mongoose.connect(uri, {
        // A reasonable pool for typically small app/dev workloads
        maxPoolSize: 10,
        // Fail fast if server selection takes too long
        serverSelectionTimeoutMS: 5000,
        // Socket timeout for operations
        socketTimeoutMS: 45000,
      });

      // Ensure indexes are created in background (does not block reads)
      // This ensures unique indexes on username/email exist and speeds up
      // queries after initial application start.
      await mongoose.connection.db.command({ ping: 1 });
      await mongoose.connection.db.admin().ping();

      // Build any declared indexes (safe and fast when small)
      await mongoose.connection.syncIndexes?.();

      console.log("✅ MongoDB connected");
      return;
    } catch (err) {
      attempt++;
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, err.message);

      if (attempt >= maxRetries) {
        console.error("❌ All MongoDB connection attempts failed.");
        console.error(
          "Hints:"
          + " 1) Ensure your Atlas cluster IP Access List includes your current IP or 0.0.0.0/0 for testing;"
          + " 2) Verify the MONGO_URI includes the database name and query params (e.g. ?retryWrites=true&w=majority);"
          + " 3) Confirm the DB user and password are correct."
        );
        process.exit(1);
      }

      const delay = 2000 * attempt; // exponential-ish backoff
      console.log(`Retrying MongoDB connection in ${delay / 1000}s...`);
      // wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default connectDB;
