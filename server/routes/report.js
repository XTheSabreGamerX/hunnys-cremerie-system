const express = require("express");
const router = express.Router();
const { getActivitySummary } = require("../controllers/reportController");
const authenticateToken= require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.get("/summary", authenticateToken, roleCheck(['admin', 'owner', 'manager']), getActivitySummary);

module.exports = router;