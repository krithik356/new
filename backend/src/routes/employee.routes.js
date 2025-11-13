const { Router } = require("express");
const { body, query } = require("express-validator");
const {
  listEmployees,
  seedEmployees,
} = require("../controllers/employeeController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

router.use(authenticate);

router.get("/", listEmployees);

router.post(
  "/seed",
  [
    authorizeRole("Admin"),
    body("employees")
      .isArray({ min: 1 })
      .withMessage("Employees array required."),
    validateRequest,
  ],
  seedEmployees
);

module.exports = router;
