// Import Joi for request data validation
const Joi = require("joi");

// ======================= SCHEMAS =======================

// Signup validation schema
const signupSchema = Joi.object({
  name: Joi.string()           // Name must be a string
    .min(2)                    // Minimum 2 characters
    .max(100)                  // Maximum 100 characters
    .required(),               // Required field
  email: Joi.string()          // Email must be a string
    .email()                   // Must be a valid email format
    .required(),               // Required field
  password: Joi.string()       // Password must be a string
    .min(6)                    // Minimum 6 characters
    .required(),               // Required field
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string()          // Email must be a string
    .email()                   // Must be a valid email format
    .required(),               // Required field
  password: Joi.string()       // Password must be a string
    .min(6)                    // Minimum 6 characters
    .required(),               // Required field
});

// ======================= GENERIC VALIDATOR =======================

/**
 * Generic middleware to validate request body against a Joi schema
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @returns Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    // Validate request body
    const { error } = schema.validate(req.body, { abortEarly: false });

    // If validation fails, return 400 with all error messages
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    // If valid, proceed to next middleware/controller
    next();
  };
};

// Export validation middleware for signup and login
module.exports = {
  signupValidate: validate(signupSchema),  // Validate signup requests
  loginValidate: validate(loginSchema),    // Validate login requests
};
