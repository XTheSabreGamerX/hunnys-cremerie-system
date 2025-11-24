const express = require("express");
const router = express.Router();
const { getBusinessReport } = require("../controllers/reportController");
const authenticateToken = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.get(
  "/",
  authenticateToken,
  roleCheck(["admin", "owner", "manager"]),
  getBusinessReport
);

module.exports = router;
