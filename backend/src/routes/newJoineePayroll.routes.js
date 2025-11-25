const { Router } = require("express");
const { body, query, param } = require("express-validator");
const {
  listNewJoinees,
  exportNewJoineeSheet,
  createNewJoinee,
  updateNewJoinee,
  deleteNewJoinee,
} = require("../controllers/newJoineePayrollController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

router.use(authenticate);

router.get(
  "/",
  [
    authorizeRole("Admin", "HOD"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  listNewJoinees
);

router.get(
  "/export",
  [
    authorizeRole("Admin", "HOD"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  exportNewJoineeSheet
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
    body("employeeName")
      .isString()
      .withMessage("Employee name is required.")
      .trim()
      .notEmpty(),
    ...sharedFieldValidators,
    validateRequest,
  ],
  createNewJoinee
);

router.put(
  "/:id",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isString().trim(),
    body("employeeName").optional().isString().trim().notEmpty(),
    ...sharedFieldValidators,
    validateRequest,
  ],
  updateNewJoinee
);

router.delete(
  "/:id",
  [authorizeRole("Admin"), param("id").isString().trim(), validateRequest],
  deleteNewJoinee
);

module.exports = router;

