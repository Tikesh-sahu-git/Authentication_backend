// Import mongoose for MongoDB object modeling
const mongoose = require("mongoose");

// Define the User schema
const userSchema = new mongoose.Schema({
  // Full name of the user
  name: {
    type: String,      // Data type: String
    required: true,    // Name is required
    trim: true         // Remove leading/trailing whitespace
  },
  
  // Email of the user
  email: {
    type: String,      // Data type: String
    required: true,    // Email is required
    unique: true,      // Ensure unique emails
    lowercase: true,   // Convert email to lowercase before saving
    trim: true         // Remove leading/trailing whitespace
  },

  // Password of the user
  password: {
    type: String,      // Data type: String
    required: true,    // Password is required
    minlength: 6       // Minimum length of 6 characters
  },

  // Verification status for OTP/email
  isVerified: {
    type: Boolean,     // Data type: Boolean
    default: false     // Defaults to false (not verified)
  }
}, {
  timestamps: true      // Automatically adds createdAt and updatedAt fields
});

// Export the User model
module.exports = mongoose.model("User", userSchema);
