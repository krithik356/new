const { Router } = require("express");
const { body, param, query } = require("express-validator");
const multer = require("multer");
const {
  listExistingEmployees,
  exportExistingEmployees,
  createExistingEmployee,
  updateExistingEmployee,
  deleteExistingEmployee,
  uploadExistingEmployeesSheet,
} = require("../controllers/existingEmployeePayrollController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(authenticate);

router.get(
  "/",
  [
    authorizeRole("Admin", "HOD"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  listExistingEmployees
);

router.get(
  "/export",
  [
    authorizeRole("Admin", "HOD"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  exportExistingEmployees
);

const sharedFieldValidators = [
  body("doj").optional().isISO8601(),
  body("doe").optional().isISO8601(),
  body("departmentId").optional().isString(),
  body("departmentKey").optional().isString(),
  body("departmentLabel").optional().isString(),
];

router.post(
  "/",
  [
    authorizeRole("Admin", "HOD"),
    body("empName")
      .isString()
      .withMessage("Employee name is required.")
      .trim()
      .notEmpty(),
    ...sharedFieldValidators,
    validateRequest,
  ],
  createExistingEmployee
);

router.put(
  "/:id",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isString().trim(),
    body("empName").optional().isString().trim().notEmpty(),
    ...sharedFieldValidators,
    validateRequest,
  ],
  updateExistingEmployee
);

router.delete(
  "/:id",
  [authorizeRole("Admin"), param("id").isString().trim(), validateRequest],
  deleteExistingEmployee
);

router.post(
  "/upload",
  [authorizeRole("Admin", "HOD"), upload.single("file")],
  uploadExistingEmployeesSheet
);

module.exports = router;


