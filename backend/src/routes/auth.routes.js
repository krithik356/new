const { Router } = require("express");
const { body, param } = require("express-validator");
const { login, createUser, signup, updateUserDepartment } = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

// Public signup
router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
    validateRequest,
  ],
  signup
);

// Auth Routes
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
    validateRequest,
  ],
  login
);

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

// Admin: Update User Department
router.put(
  "/users/:userId/department",
  [
    authenticate,
    authorizeRole("Admin"),
    param("userId").isMongoId().withMessage("Invalid user ID."),
    body("department")
      .optional({ nullable: true })
      .isMongoId()
      .withMessage("Invalid department ID."),
    validateRequest,
  ],
  updateUserDepartment
);

module.exports = router;
