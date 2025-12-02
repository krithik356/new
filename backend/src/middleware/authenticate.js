const { verifyToken } = require("../config/jwt");
const { User } = require("../models/User");

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user info to request
 * For HOD users, fetches current department from database to ensure accuracy
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
async function authenticate(req, res, next) {
  // Extract token from Authorization header (format: "Bearer <token>")
  const authorizationHeader = req.headers.authorization || "";
  const token = authorizationHeader.startsWith("Bearer ") 
    ? authorizationHeader.slice(7) 
    : null;

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing.",
    });
  }

  try {
    // Verify and decode the JWT token
    const tokenPayload = verifyToken(token);
    
    // Normalize user role (case-sensitive matching)
    const userRole =
      tokenPayload.role === "Admin"
        ? "Admin"
        : tokenPayload.role === "HOD"
        ? "HOD"
        : tokenPayload.role;

    let departmentId = tokenPayload.department || null;

    // For HOD users, always fetch department from database to ensure it's current and valid
    // This prevents issues if department assignment changes after token was issued
    if (userRole === "HOD") {
      const userRecord = await User.findById(tokenPayload.id)
        .select("department")
        .lean();
      
      if (userRecord?.department) {
        // Use database value (most up-to-date)
        departmentId = userRecord.department.toString();
      } else {
        // No department in database, set to null regardless of token
        departmentId = null;
      }
    }

    // Attach user information to request object for use in subsequent middleware/routes
    req.user = {
      id: tokenPayload.id,
      role: userRole,
      department: departmentId,
    };

    return next();
  } catch (error) {
    // Token is invalid, expired, or tampered with
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

module.exports = { authenticate };
