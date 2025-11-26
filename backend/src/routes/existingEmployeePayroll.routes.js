const express = require("express");

const router = express.Router();

const {
  listExistingEmployeePayrolls,
  createExistingEmployeePayroll,
  updateExistingEmployeePayroll,
  deleteExistingEmployeePayroll,
  exportExistingEmployeePayrollSheet,
} = require("../controllers/existingEmployeePayrollController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");

router.use(authenticate);

router.get(
  "/export/sheet",
  authorizeRole("Admin", "HOD"),
  exportExistingEmployeePayrollSheet
);

router
  .route("/")
  .get(authorizeRole("Admin", "HOD"), listExistingEmployeePayrolls)
  .post(authorizeRole("Admin", "HOD"), createExistingEmployeePayroll);

router
  .route("/:id")
  .put(authorizeRole("Admin", "HOD"), updateExistingEmployeePayroll)
  .delete(authorizeRole("Admin"), deleteExistingEmployeePayroll);

module.exports = router;


