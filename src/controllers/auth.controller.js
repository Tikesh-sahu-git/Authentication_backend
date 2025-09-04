// ======================= IMPORTS =======================
const User = require("../models/user.model");   // User model
const bcrypt = require("bcrypt");               // Password hashing
const jwt = require("jsonwebtoken");            // JWT generation & verification
const sendEmail = require("../utils/sendEmail");// Email sending utility
const crypto = require("crypto");               // For OTP generation
const { validationResult } = require("express-validator"); // Express validation results

// ======================= CONSTANTS =======================
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // JWT secret
const JWT_EXPIRE = process.env.JWT_EXPIRE || "1d";             // Token expiration
const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "token";// Cookie name
const JWT_COOKIE_EXPIRE = parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7; // Cookie expiry in days

const OTP_EXPIRY_TIME = 10 * 60 * 1000; // OTP valid for 10 minutes
const OTP_LENGTH = 6;                   // 6-digit OTP

// In-memory OTP storage (for production, use DB or Redis)
let otpCache = new Map();

// ======================= HELPER FUNCTIONS =======================

// Generate a numeric OTP
const generateOtp = () => {
  return crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH - 1);
};

// Generate HTML template for OTP email
const generateOtpEmailTemplate = (userName, otp) => `
<div style="font-family: 'Roboto', Arial, sans-serif; background-color: #f4f6f9; padding: 30px; color: #333;">
  <!-- Email content including OTP -->
</div>
`;

// Send standardized error response
const sendErrorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ message });

// Send standardized success response
const sendSuccessResponse = (res, statusCode, data = {}) =>
  res.status(statusCode).json({ ...data });

// Validate request using express-validator
const validateRequest = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  return null;
};

// Set JWT cookie in response
const setJwtCookie = (res, token) => {
  res.cookie(JWT_COOKIE_NAME, token, {
    httpOnly: true,                        // Prevent access from JS
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",                     // CSRF protection
    maxAge: JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000, // Expiry in ms
  });
};

// Send OTP email
const sendOtpEmail = async (email, userName, otp, subject) => {
  const html = generateOtpEmailTemplate(userName, otp);
  await sendEmail(email, subject, html);
};

// Remove expired OTPs from memory
const cleanExpiredOtps = () => {
  const now = Date.now();
  for (const [email, data] of otpCache.entries()) {
    if (now - data.timestamp > OTP_EXPIRY_TIME) {
      otpCache.delete(email);
    }
  }
};

// ======================= CONTROLLERS =======================

// Register a new user
const registerUser = async (req, res) => {
  try {
    // Validate request body
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return sendErrorResponse(res, 400, "User already exists");

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    // Generate OTP, store in cache, and send email
    const otp = generateOtp();
    otpCache.set(email, { otp, timestamp: Date.now() });
    await sendOtpEmail(email, name, otp, "OTP for Account Verification");

    return sendSuccessResponse(res, 201, {
      message: "User registered successfully. Please check your email for the OTP.",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Verify user OTP
const verifyOtp = async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;

    const { email, otp } = req.body;
    if (!email || !otp) return sendErrorResponse(res, 400, "Email and OTP are required");

    cleanExpiredOtps();

    const otpData = otpCache.get(email);
    if (!otpData) return sendErrorResponse(res, 400, "OTP not generated or expired");
    if (parseInt(otp) !== otpData.otp) return sendErrorResponse(res, 400, "Invalid OTP");

    otpCache.delete(email);

    // Update user as verified
    const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
    if (!user) return sendErrorResponse(res, 404, "User not found");

    // Generate JWT and set cookie
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    setJwtCookie(res, token);

    return sendSuccessResponse(res, 200, {
      message: "Account verified successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return sendErrorResponse(res, 401, "Invalid email or password");
    if (!user.isVerified) return sendErrorResponse(res, 401, "Please verify your account first");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendErrorResponse(res, 401, "Invalid email or password");

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    setJwtCookie(res, token);

    return sendSuccessResponse(res, 200, {
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// Logout user
const logoutUser = (req, res) => {
  res
    .clearCookie(JWT_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json({ message: "Logout successful" });
};

// Resend OTP
const resendOtp = async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;

    const { email } = req.body;
    if (!email) return sendErrorResponse(res, 400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) return sendErrorResponse(res, 404, "User not found");

    const otp = generateOtp();
    otpCache.set(email, { otp, timestamp: Date.now() });
    await sendOtpEmail(email, user.name, otp, "New OTP for Account Verification");

    return sendSuccessResponse(res, 200, { message: "New OTP sent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

// ======================= EXPORT CONTROLLERS =======================
module.exports = {
  registerUser,
  verifyOtp,
  loginUser,
  logoutUser,
  resendOtp,
};
