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

router.use(authenticate);

router.get("/", authorizeRole("Admin"), getDepartments);

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
