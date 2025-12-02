/**
 * Middleware to handle 404 Not Found errors
 * Called when no route matches the requested URL
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: "Resource not found.",
    path: req.originalUrl,
  });
}

/**
 * Global error handler middleware
 * Catches all errors thrown in the application and sends appropriate responses
 * Logs errors for debugging while sending user-friendly messages to clients
 * 
 * @param {Error} err - The error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function errorHandler(err, req, res, next) {
  // Log the full error for debugging purposes
  console.error(err);

  // If response headers were already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine HTTP status code from error object or default to 500
  const statusCode = err.statusCode || err.status || 500;

  // Send error response with user-friendly message
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
    details: err.details || undefined,
  });
}

module.exports = { notFound, errorHandler };
