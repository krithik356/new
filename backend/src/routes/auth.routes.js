const { Router } = require("express");
const { body } = require("express-validator");
const { login, createUser } = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

// Auth Routes
router.post("/login", login);

// Admin: Create User
router.post(
  "/users",
  [
    authenticate,
    authorizeRole("Admin"),
    body("name").notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
    body("role").isIn(["Admin", "HOD"]).withMessage("Invalid role."),
    body("department")
      .optional()
      .isMongoId()
      .withMessage("Invalid department ID."),
    validateRequest,
  ],
  createUser
);

module.exports = router;
