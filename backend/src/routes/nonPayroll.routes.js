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
  (req, res, next) => nonPayrollController.exportNonPayrollItems(req, res, next)
);

router.get(
  "/",
  authorizeRole("Admin", "HOD"),
  (req, res, next) => nonPayrollController.listNonPayrollItems(req, res, next)
);

router.post(
  "/",
  authorizeRole("Admin", "HOD"),
  (req, res, next) => nonPayrollController.createNonPayrollItem(req, res, next)
);

router.put(
  "/:id",
  authorizeRole("Admin", "HOD"),
  (req, res, next) => nonPayrollController.updateNonPayrollItem(req, res, next)
);

router.delete(
  "/:id",
  authorizeRole("Admin", "HOD"),
  (req, res, next) => nonPayrollController.deleteNonPayrollItem(req, res, next)
);

router.post(
  "/upload",
  authorizeRole("Admin", "HOD"),
  upload.single("file"),
  (req, res, next) => nonPayrollController.uploadNonPayrollItems(req, res, next)
);

module.exports = router;
