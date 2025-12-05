const { Router } = require("express");
const { body, param, query } = require("express-validator");
const multer = require("multer");
const {
  listExistingEmployees,
  exportExistingEmployees,
  createExistingEmployee,
  updateExistingEmployee,
  deleteExistingEmployee,
  deleteAllExistingEmployees,
  uploadExistingEmployeesSheet,
  requestSignOff,
  decideSignOff,
  getHodDepartments,
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
  "/hod-departments",
  [
    authorizeRole("HOD", "DataFiller"),
    validateRequest,
  ],
  getHodDepartments
);

router.get(
  "/",
  [
    authorizeRole("Admin", "HOD", "DataFiller"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  listExistingEmployees
);

router.get(
  "/export",
  [
    authorizeRole("Admin", "HOD", "DataFiller"),
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
    authorizeRole("Admin", "HOD", "DataFiller"),
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

router.post(
  "/upload",
  [authorizeRole("Admin", "HOD", "DataFiller"), upload.single("file")],
  uploadExistingEmployeesSheet
);

// Sign-off routes must come before /:id routes to ensure proper matching
router.post(
  "/:id/signoff/decision",
  [
    authorizeRole("HOD"),
    param("id").isString().trim(),
    body("decision")
      .isIn(["accepted", "rejected"])
      .withMessage("Decision must be 'accepted' or 'rejected'."),
    body("remark")
      .optional()
      .isString()
      .trim()
      .custom((value, { req }) => {
        if (req.body.decision === "rejected" && !value?.trim()) {
          throw new Error("Remark is required when rejecting.");
        }
        return true;
      }),
    validateRequest,
  ],
  decideSignOff
);

router.post(
  "/:id/signoff",
  [
    authorizeRole("Admin", "HOD", "DataFiller"),
    param("id").isString().trim(),
    validateRequest,
  ],
  requestSignOff
);

router.put(
  "/:id",
  [
    authorizeRole("Admin", "HOD", "DataFiller"),
    param("id").isString().trim(),
    body("empName").optional().isString().trim().notEmpty(),
    ...sharedFieldValidators,
    validateRequest,
  ],
  updateExistingEmployee
);

router.delete(
  "/all",
  [
    authorizeRole("Admin"),
    validateRequest,
  ],
  deleteAllExistingEmployees
);

router.delete(
  "/:id",
  [
    authorizeRole("Admin", "HOD", "DataFiller"),
    param("id").isString().trim(),
    validateRequest,
  ],
  deleteExistingEmployee
);

module.exports = router;


