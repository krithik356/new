const { Router } = require("express");
const { query } = require("express-validator");
const {
  exportContributions,
  exportDepartmentReport,
  exportDepartmentEmployeeContributions,
  sendSheetToAdmin,
  exportDepartmentEmployeeContributionsByAdmin,
} = require("../controllers/exportController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

router.get(
  "/",
  [
    authenticate,
    authorizeRole("Admin"),
    query("cycle").optional().isString(),
    validateRequest,
  ],
  exportContributions
);

router.get(
  "/departments",
  [
    authenticate,
    authorizeRole("Admin"),
    query("cycle").optional().isString(),
    validateRequest,
  ],
  exportDepartmentReport
);

router.get(
  "/department/employees",
  [
    authenticate,
    authorizeRole("HOD"),
    query("cycle").optional().isString(),
    validateRequest,
  ],
  exportDepartmentEmployeeContributions
);

router.post(
  "/department/employees/send",
  [
    authenticate,
    authorizeRole("HOD"),
    query("cycle").optional().isString(),
    validateRequest,
  ],
  sendSheetToAdmin
);

router.get(
  "/department/:departmentName/employees",
  [
    authenticate,
    authorizeRole("Admin"),
    query("cycle").optional().isString(),
    validateRequest,
  ],
  exportDepartmentEmployeeContributionsByAdmin
);

module.exports = router;
