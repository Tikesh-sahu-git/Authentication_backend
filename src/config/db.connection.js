// ======================= IMPORTS =======================
const mongoose = require("mongoose"); // MongoDB ODM for Node.js
const dotenv = require("dotenv");     // Load environment variables

dotenv.config(); // Load variables from .env file

// ======================= DATABASE URI =======================
// Get DB name from environment variables
const dbname = process.env.DB_NAME;

// Construct MongoDB URI either from MONGO_URI or using individual credentials
const dbURI =
  process.env.MONGO_URI ||
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${dbname}?retryWrites=true&w=majority`;

// ======================= RETRY CONFIG =======================
let retryCount = 0;                 // Keep track of connection attempts
const MAX_RETRY_DELAY = 60000;      // Maximum delay between retries (60s)

// ======================= CONNECT FUNCTION =======================
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB
    await mongoose.connect(dbURI, {
      dbName: dbname,                   // Specify the database name
      serverSelectionTimeoutMS: 5000,   // Timeout if server cannot be selected in 5s
    });

    console.log("✅ MongoDB connected"); // Log success
    retryCount = 0;                       // Reset retry counter on success
  } catch (error) {
    // Increment retry count on failure
    retryCount++;

    // Exponential backoff for retries, capped at MAX_RETRY_DELAY
    const retryDelay = Math.min(5000 * 2 ** (retryCount - 1), MAX_RETRY_DELAY);

    console.error(`❌ DB connection failed: ${error.message}`);
    console.log(`⏳ Retrying connection in ${retryDelay / 1000} seconds...`);

    // Retry connection after calculated delay
    setTimeout(connectDB, retryDelay);
  }
};

// ======================= EXPORT =======================
module.exports = connectDB;
