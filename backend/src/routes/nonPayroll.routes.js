const express = require("express");
const multer = require("multer");

const {
  listNonPayrollItems,
  createNonPayrollItem,
  updateNonPayrollItem,
  deleteNonPayrollItem,
  exportNonPayrollItems,
  uploadNonPayrollItems,
} = require("../controllers/nonPayrollController");
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
  exportNonPayrollItems
);

router.get("/", authorizeRole("Admin", "HOD"), listNonPayrollItems);

router.post("/", authorizeRole("Admin", "HOD"), createNonPayrollItem);

router.put("/:id", authorizeRole("Admin", "HOD"), updateNonPayrollItem);

router.delete("/:id", authorizeRole("Admin", "HOD"), deleteNonPayrollItem);

router.post(
  "/upload",
  authorizeRole("Admin", "HOD"),
  upload.single("file"),
  uploadNonPayrollItems
);

module.exports = router;
