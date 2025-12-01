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

// Helper to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error('Unhandled error in TA requirement route:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  });
};

// Specific routes should come before parameterized routes
router.get(
  "/export",
  [
    authorizeRole("Admin", "HOD"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  asyncHandler(exportTARequirementSheet)
);

router.post(
  "/sync",
  [
    authorizeRole("Admin"),
    body("roles").optional().isArray(),
    body("roles.*").optional().isString(),
    validateRequest,
  ],
  asyncHandler(syncTARequirements)
);

router.get(
  "/",
  [
    authorizeRole("Admin", "HOD"),
    query("department").optional().isString().trim(),
    validateRequest,
  ],
  asyncHandler(listTARequirements)
);

router.post(
  "/",
  [
    authorizeRole("Admin", "HOD"),
    body("roleName").isString().trim().notEmpty(),
    validateRequest,
  ],
  asyncHandler(createTARequirement)
);

router.put(
  "/:id",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isString().trim(),
    validateRequest,
  ],
  asyncHandler(updateTARequirement)
);

router.delete(
  "/:id",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isString().trim(),
    validateRequest,
  ],
  asyncHandler(deleteTARequirement)
);

module.exports = router;


