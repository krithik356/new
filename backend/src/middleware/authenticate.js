const { verifyToken } = require("../config/jwt");

function authenticate(req, res, next) {
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
    // Ensure role is exactly "Admin" or "HOD" (case-sensitive)
    const userRole = payload.role === "Admin" ? "Admin" : payload.role === "HOD" ? "HOD" : payload.role;
    
    req.user = {
      id: payload.id,
      role: userRole,
      department: payload.department || null,
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
