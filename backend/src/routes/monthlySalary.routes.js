const { Router } = require("express");
const { query } = require("express-validator");
const mongoose = require("mongoose");
const { MONTHS } = require("../models/MonthlySalary");
const { listMonthlySalaries } = require("../controllers/monthlySalaryController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

router.get(
  "/",
  [
    authenticate,
    authorizeRole("Admin", "HOD"),
    query("month")
      .exists()
      .withMessage("Month is required.")
      .custom((value) => MONTHS.includes(value))
      .withMessage(`Month must be one of: ${MONTHS.join(", ")}`),
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("Year must be between 2000 and 2100."),
    query("departmentId")
      .optional()
      .custom((value) => value === "all" || mongoose.isValidObjectId(value))
      .withMessage("departmentId must be a valid ID or 'all'."),
    validateRequest,
  ],
  listMonthlySalaries
);

module.exports = router;
