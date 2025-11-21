const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { authorizeRole } = require("../middleware/authorize");
const {
  getOverview,
  getContractors,
  getVendors,
  getInterns,
  getProducts,
  getSpendEfficiency,
  getContractsAndRisks,
} = require("../controllers/nonPayrollController");

const router = express.Router();

router.use(authenticate);

router.get("/overview", authorizeRole("Admin"), getOverview);
router.get(
  "/contractors",
  authorizeRole("Admin", "HOD"),
  getContractors
);
router.get("/vendors", authorizeRole("Admin", "HOD"), getVendors);
router.get("/interns", authorizeRole("Admin", "HOD"), getInterns);
router.get("/products", authorizeRole("Admin", "HOD"), getProducts);
router.get(
  "/spend-efficiency",
  authorizeRole("Admin", "HOD"),
  getSpendEfficiency
);
router.get(
  "/contracts-risks",
  authorizeRole("Admin", "HOD"),
  getContractsAndRisks
);

module.exports = router;

