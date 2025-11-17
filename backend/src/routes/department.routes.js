const { Router } = require("express");
const { body, param } = require("express-validator");
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} = require("../controllers/departmentController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

// Public endpoint to list departments (for signup)
router.get("/public", async (req, res, next) => {
  try {
    const { Department } = require("../models/Department");
    const departments = await Department.find().select("name code").lean();
    return res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    return next(error);
  }
});

router.use(authenticate);

// Allow both Admin and HOD to get departments (HOD sees only their own)
router.get("/", authorizeRole("Admin", "HOD"), getDepartments);

router.get(
  "/:id",
  [authorizeRole("Admin", "HOD"), param("id").isMongoId(), validateRequest],
  getDepartmentById
);

router.post(
  "/",
  [
    authorizeRole("Admin"),
    body("name").notEmpty().withMessage("Name is required."),
    body("code").optional().isString(),
    body("hod").optional({ nullable: true }).isMongoId(),
    validateRequest,
  ],
  createDepartment
);

router.put(
  "/:id",
  [
    authorizeRole("Admin"),
    param("id").isMongoId(),
    body("name").optional().notEmpty(),
    body("code").optional().isString(),
    body("hod").optional({ nullable: true }).isMongoId(),
    validateRequest,
  ],
  updateDepartment
);

module.exports = router;
