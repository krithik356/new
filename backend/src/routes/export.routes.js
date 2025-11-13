const { Router } = require("express");
const { query } = require("express-validator");
const { exportContributions } = require("../controllers/exportController");
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

module.exports = router;
