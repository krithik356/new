const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg || err.message);
    return res.status(400).json({
      success: false,
      message: errorMessages.length === 1 ? errorMessages[0] : "Validation failed.",
      errors: errors.array(),
    });
  }

  return next();
}

module.exports = { validateRequest };
