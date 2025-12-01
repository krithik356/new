const express = require("express");
const multer = require("multer");

const nonPayrollController = require("../controllers/nonPayrollController");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(authenticate);

router.get(
  "/export",
  authorizeRole("Admin", "HOD"),
  nonPayrollController.exportNonPayrollItems
);

router.get(
  "/",
  authorizeRole("Admin", "HOD"),
  nonPayrollController.listNonPayrollItems
);

router.post(
  "/",
  authorizeRole("Admin", "HOD"),
  nonPayrollController.createNonPayrollItem
);

router.put(
  "/:id",
  authorizeRole("Admin", "HOD"),
  nonPayrollController.updateNonPayrollItem
);

router.delete(
  "/:id",
  authorizeRole("Admin", "HOD"),
  nonPayrollController.deleteNonPayrollItem
);

router.post(
  "/upload",
  authorizeRole("Admin", "HOD"),
  upload.single("file"),
  nonPayrollController.uploadNonPayrollItems
);

module.exports = router;
