/**
 * Middleware factory that creates authorization middleware for role-based access control
 * Checks if the authenticated user has one of the required roles
 * 
 * @param {...string} roles - One or more allowed roles (e.g., "Admin", "HOD")
 * @returns {function} Express middleware function
 * 
 * @example
 * // Only allow Admin users
 * router.get('/admin-only', authenticate, authorizeRole('Admin'), handler);
 * 
 * @example
 * // Allow both Admin and HOD users
 * router.get('/admin-or-hod', authenticate, authorizeRole('Admin', 'HOD'), handler);
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Normalize user role (case-sensitive matching for Admin and HOD)
    const userRole = 
      req.user.role === "Admin" 
        ? "Admin" 
        : req.user.role === "HOD" 
        ? "HOD" 
        : req.user.role;

    // Check if user has one of the required roles
    const hasRequiredRole = roles.includes(userRole);
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action. Required role: ${roles.join(" or ")}. Your role: ${userRole || "none"}.`,
      });
    }

    // Update req.user.role to ensure consistency throughout the request
    req.user.role = userRole;

    return next();
  };
}

/**
 * Middleware factory that creates authorization middleware for department-based access control
 * Admins can access any department, while HOD users can only access their own department
 * 
 * @param {string} paramName - Name of the route parameter containing department ID (default: "departmentId")
 * @returns {function} Express middleware function
 * 
 * @example
 * // Check department access from route parameter
 * router.get('/departments/:departmentId/data', authenticate, authorizeDepartmentAccess('departmentId'), handler);
 * 
 * @example
 * // Check department access from request body
 * router.post('/data', authenticate, authorizeDepartmentAccess(), handler);
 * // Looks for req.body.department or req.query.department
 */
function authorizeDepartmentAccess(paramName = "departmentId") {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Normalize user role (case-sensitive matching for Admin and HOD)
    const userRole = 
      req.user.role === "Admin" 
        ? "Admin" 
        : req.user.role === "HOD" 
        ? "HOD" 
        : req.user.role;
    
    // Admins have access to all departments, skip department check
    if (userRole === "Admin") {
      return next();
    }

    // Extract department ID from route params, request body, or query string
    const requestedDepartmentId =
      req.params[paramName] || req.body.department || req.query.department;

    // Ensure department ID is provided
    if (!requestedDepartmentId) {
      return res.status(400).json({
        success: false,
        message: "Department identifier is required.",
      });
    }

    // Check if user's department matches the requested department
    const userDepartmentId = String(req.user.department);
    const requestedDepartmentIdString = String(requestedDepartmentId);
    
    if (userDepartmentId !== requestedDepartmentIdString) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this department resource.",
      });
    }

    return next();
  };
}

module.exports = { authorizeRole, authorizeDepartmentAccess };
