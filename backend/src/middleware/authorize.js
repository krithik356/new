function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Ensure role is exactly "Admin" or "HOD" (case-sensitive)
    const userRole = req.user.role === "Admin" ? "Admin" : req.user.role === "HOD" ? "HOD" : req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action. Required role: ${roles.join(" or ")}. Your role: ${userRole || "none"}.`,
      });
    }

    // Update req.user.role to ensure consistency
    req.user.role = userRole;

    return next();
  };
}

function authorizeDepartmentAccess(paramName = "departmentId") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Ensure role is exactly "Admin" or "HOD" (case-sensitive)
    const userRole = req.user.role === "Admin" ? "Admin" : req.user.role === "HOD" ? "HOD" : req.user.role;
    
    if (userRole === "Admin") {
      return next();
    }

    const departmentId =
      req.params[paramName] || req.body.department || req.query.department;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department identifier is required.",
      });
    }

    if (String(req.user.department) !== String(departmentId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this department resource.",
      });
    }

    return next();
  };
}

module.exports = { authorizeRole, authorizeDepartmentAccess };
