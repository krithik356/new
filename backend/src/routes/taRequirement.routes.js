const { Router } = require("express");
const { body, param, query } = require("express-validator");
const {
  listTARequirements,
  createTARequirement,
  updateTARequirement,
  deleteTARequirement,
  syncTARequirements,
  exportTARequirementSheet,
} = require("../controllers/taRequirementController");
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
  listTARequirements
);

router.post(
  "/",
  [
    authorizeRole("Admin", "HOD"),
    body("roleName").isString().trim().notEmpty(),
    validateRequest,
  ],
  createTARequirement
);

router.put(
  "/:id",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isString().trim(),
    validateRequest,
  ],
  updateTARequirement
);

router.delete(
  "/:id",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isString().trim(),
    validateRequest,
  ],
  deleteTARequirement
);

router.post(
  "/sync",
  [
    authorizeRole("Admin"),
    body("roles").optional().isArray(),
    body("roles.*").optional().isString(),
    validateRequest,
  ],
  syncTARequirements
);

router.get(
  "/export",
  [
    authorizeRole("Admin", "HOD"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  exportTARequirementSheet
);

module.exports = router;


