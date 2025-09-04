// Import Express Router
const router = require('express').Router();

// Import validation middlewares for signup and login
const { loginValidate, signupValidate } = require('../middlewares/authvalidation');

// Import controller functions for authentication
const { 
  registerUser,   // Handles user registration
  loginUser,      // Handles user login
  logoutUser,     // Handles user logout
  verifyOtp,      // Handles OTP verification
  resendOtp       // Handles resending OTP
} = require("../controllers/auth.controller");

// ======================= ROUTES =======================

// POST /signup
// - Validates the request body using signupValidate middleware
// - Registers a new user
router.post("/signup", signupValidate, registerUser);      

// POST /verify-otp
// - Verifies the OTP sent to the user's email
router.post("/verify-otp", verifyOtp);       

// POST /resend-otp
// - Sends a new OTP to the user's email
router.post("/resend-otp", resendOtp);       

// POST /login
// - Validates the request body using loginValidate middleware
// - Authenticates the user and returns a token
router.post("/login", loginValidate, loginUser);            

// POST /logout
// - Logs out the user by clearing the session/cookie
router.post("/logout", logoutUser);          

// Export the router to use in main server file
module.exports = router;
