const express = require("express");
const router = express.Router();
const {
  getTotalSales,
  getTotalProfit,
  getTopSellingItems,
} = require("../controllers/salesReportController");
const authenticateToken = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.get(
  "/total",
  authenticateToken,
  roleCheck(["admin", "owner", "manager"]),
  getTotalSales
);

router.get(
  "/profit",
  authenticateToken,
  roleCheck(["admin", "owner", "manager"]),
  getTotalProfit
);

router.get(
  "/best-selling",
  authenticateToken,
  roleCheck(["admin", "owner", "manager"]),
  getTopSellingItems
);

module.exports = router;
