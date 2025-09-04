// Import core dependencies
const express = require("express");          // Express framework
const cookieParser = require("cookie-parser"); // Parse cookies from requests
const helmet = require("helmet");            // Security headers
const cors = require("cors");                // Enable Cross-Origin Resource Sharing
const morgan = require("morgan");            // HTTP request logger
const rateLimit = require("express-rate-limit"); // Rate limiting middleware

// Load environment variables from .env file
require("dotenv").config();

// Initialize Express app
const app = express();

// ======================= MIDDLEWARE =======================

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Security headers to protect against common vulnerabilities
app.use(helmet());

// Logging requests in development mode
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors({
  origin: process.env.CLIENT_URL?.split(",") || ["https://authentication-nine-zeta.vercel.app"], // allow specific origins
  credentials: true, // allow cookies to be sent
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // allowed headers
}));

// Rate limiting to prevent brute-force attacks
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Limit each IP to 100 requests per window
  message: { message: "Too many requests, please try again later." }, // Response message
  standardHeaders: true,     // Return rate limit info in headers
  legacyHeaders: false,      // Disable `X-RateLimit-*` headers
}));

// ======================= ROUTES =======================

// Test route for API
app.get("/", (req, res) => res.send("🚀 API is running..."));

// Auth routes
app.use("/api/auth", require("./src/routes/auth.router"));



// ======================= ERROR HANDLING =======================

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack); // Log the error stack for debugging
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!", // Send error message to client
  });
});

// Export the Express app
module.exports = app;
