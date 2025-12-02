const express = require("express");
const multer = require("multer");

const nonPayrollController = require("../controllers/nonPayrollController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Apply authentication middleware to all routes
router.use(authenticate);

// Export non payroll items
router.get(
  "/export",
  authorizeRole("Admin", "HOD", "DataFiller"),
  nonPayrollController.exportNonPayrollItems
);

// List non payroll items
router.get(
  "/",
  authorizeRole("Admin", "HOD", "DataFiller"),
  nonPayrollController.listNonPayrollItems
);

// Create non payroll item
router.post(
  "/",
  authorizeRole("Admin", "HOD", "DataFiller"),
  nonPayrollController.createNonPayrollItem
);

// Update non payroll item
router.put(
  "/:id",
  authorizeRole("Admin", "HOD", "DataFiller"),
  nonPayrollController.updateNonPayrollItem
);

// Delete non payroll item
router.delete(
  "/:id",
  authorizeRole("Admin", "HOD", "DataFiller"),
  nonPayrollController.deleteNonPayrollItem
);

// Upload non payroll items
router.post(
  "/upload",
  authorizeRole("Admin", "HOD", "DataFiller"),
  upload.single("file"),
  nonPayrollController.uploadNonPayrollItems
);

module.exports = router;
