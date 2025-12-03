const { Router } = require("express");
const { body, query, param } = require("express-validator");
const multer = require("multer");
const {
  listNewJoinees,
  exportNewJoineeSheet,
  uploadNewJoineeSheet,
  createNewJoinee,
  updateNewJoinee,
  deleteNewJoinee,
  signOffNewJoinee,
} = require("../controllers/newJoineePayrollController");
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
    authorizeRole("Admin", "HOD", "DataFiller"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  listNewJoinees
);

router.get(
  "/export",
  [
    authorizeRole("Admin", "HOD", "DataFiller"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  exportNewJoineeSheet
);

router.post(
  "/upload",
  [authorizeRole("Admin", "HOD", "DataFiller"), upload.single("file")],
  uploadNewJoineeSheet
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
    authorizeRole("Admin", "HOD", "DataFiller"),
    param("id").isString().trim(),
    body("employeeName").optional().isString().trim().notEmpty(),
    ...sharedFieldValidators,
    validateRequest,
  ],
  updateNewJoinee
);

router.delete(
  "/:id",
  [
    authorizeRole("Admin", "HOD", "DataFiller"),
    param("id").isString().trim(),
    validateRequest,
  ],
  deleteNewJoinee
);

router.post(
  "/:id/sign-off",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isString().trim(),
    validateRequest,
  ],
  signOffNewJoinee
);

module.exports = router;

