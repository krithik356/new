const { Router } = require("express");
const { body, param, query } = require("express-validator");
const {
  listContributions,
  getContributionByDepartment,
  getEmployeesWithContributions,
  createContribution,
  updateContribution,
  deleteContribution,
} = require("../controllers/contributionController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const { validateRequest } = require("../middleware/validateRequest");

const router = Router();

router.use(authenticate);

router.get(
  "/all",
  [
    authorizeRole("Admin", "HOD"),
    query("cycle").optional().isString(),
    query("year").optional().isInt({ min: 2000, max: 2100 }),
    validateRequest,
  ],
  listContributions
);

router.get(
  "/employees",
  [
    authorizeRole("Admin", "HOD"),
    query("cycle").optional().isString(),
    query("year").optional().isInt({ min: 2000, max: 2100 }),
    validateRequest,
  ],
  getEmployeesWithContributions
);

router.get(
  "/department/:departmentId",
  [
    authorizeRole("Admin", "HOD"),
    param("departmentId").isMongoId(),
    query("year").optional().isInt({ min: 2000, max: 2100 }),
    validateRequest,
  ],
  getContributionByDepartment
);

router.post(
  "/",
  [
    authorizeRole("HOD"),
    body("department").isMongoId().withMessage("Department is required."),
    body("academy").isNumeric().withMessage("Academy must be numeric."),
    body("intensive").isNumeric().withMessage("Intensive must be numeric."),
    body("niat").isNumeric().withMessage("NIAT must be numeric."),
    body("remarks").optional().isString(),
    body("cycle").optional().isString(),
    body("year").optional().isInt({ min: 2000, max: 2100 }),
    validateRequest,
  ],
  createContribution
);

router.put(
  "/:id",
  [
    authorizeRole("Admin", "HOD"),
    param("id").isMongoId(),
    body("academy").optional().isNumeric(),
    body("intensive").optional().isNumeric(),
    body("niat").optional().isNumeric(),
    body("remarks").optional().isString(),
    body("cycle").optional().isString(),
    body("year").optional().isInt({ min: 2000, max: 2100 }),
    validateRequest,
  ],
  updateContribution
);

router.delete(
  "/:id",
  [authorizeRole("Admin"), param("id").isMongoId(), validateRequest],
  deleteContribution
);

module.exports = router;
