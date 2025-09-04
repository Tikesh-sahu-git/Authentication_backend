// Import jsonwebtoken for JWT verification
const jwt = require("jsonwebtoken");

// Use JWT secret from environment variables, fallback to default
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Authentication middleware to protect routes
 * - Verifies JWT from request cookies or headers
 * - Attaches decoded user info to req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    // ✅ Extract token from either:
    // 1. Cookies: req.cookies.token
    // 2. Authorization header: Bearer <token>
    const token =
      req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

    // If no token is provided, block access
    if (!token) {
      return res.status(401).json({ message: "No token provided, Unauthorized" });
    }

    // ✅ Verify token validity
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Invalid or expired token
        return res.status(403).json({ message: "Invalid or expired token, Forbidden" });
      }

      // ✅ Attach decoded payload (user info) to request object
      req.user = decoded;

      // Proceed to the next middleware or route handler
      next();
    });
  } catch (error) {
    // Catch unexpected errors
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Export the middleware to be used in protected routes
module.exports = authMiddleware;
