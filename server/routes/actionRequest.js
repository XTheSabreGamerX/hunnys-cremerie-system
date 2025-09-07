const express = require("express");
const router = express.Router();
const {
  getAllRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/actionRequestController");
const roleCheck = require("../middleware/roleCheck");
const authenticateToken = require("../middleware/auth");

router.get('/', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getAllRequests);

router.post('/approve/:id', authenticateToken, roleCheck(['admin', 'owner', 'manager']), approveRequest);

router.delete('/reject/:id', authenticateToken, roleCheck(['admin', 'owner', 'manager']), rejectRequest);

module.exports = router;