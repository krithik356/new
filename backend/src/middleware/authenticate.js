const { verifyToken } = require("../config/jwt");
const { User } = require("../models/User");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing.",
    });
  }

  try {
    const payload = verifyToken(token);
    const userRole =
      payload.role === "Admin"
        ? "Admin"
        : payload.role === "HOD"
        ? "HOD"
        : payload.role;

    let departmentId = payload.department || null;

    // For HODs, always get department from database to ensure it's current and valid
    if (userRole === "HOD") {
      const user = await User.findById(payload.id).select("department").lean();
      if (user?.department) {
        // Use database value (most up-to-date)
        departmentId = user.department.toString();
      } else {
        // No department in database, set to null regardless of token
        departmentId = null;
      }
    }

    req.user = {
      id: payload.id,
      role: userRole,
      department: departmentId,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

module.exports = { authenticate };
