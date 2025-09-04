// Import Mongoose for MongoDB connection
const mongoose = require("mongoose");

// Import the Express app
const app = require("./app");

// Import the database connection function
const connectDB = require("./src/config/db.connection");

// Load environment variables from .env file
require("dotenv").config();

// ======================= DATABASE CONNECTION =======================
// Connect to MongoDB using the connectDB function
connectDB();

// ======================= SERVER SETUP =======================
// Set the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Start the Express server
const server = app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

// ======================= GRACEFUL SHUTDOWN =======================
// Listen for SIGINT (Ctrl+C) to gracefully shutdown server & DB connection
process.on("SIGINT", async () => {
  // Close Mongoose connection
  await mongoose.connection.close();

  // Close the server
  server.close(() => {
    console.log("🔌 Server & MongoDB connection closed");
    process.exit(0); // Exit the process
  });
});
