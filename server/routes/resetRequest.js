const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const roleCheck = require("../middleware/roleCheck");
const {
  createResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
  deleteResetRequest,
  resetPassword
} = require("../controllers/resetRequestController");

router.post('/', createResetRequest);

router.get('/', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getResetRequests);

router.put('/:id/approve', authenticateToken, roleCheck(['admin', 'owner', 'manager']), approveResetRequest);

router.put('/:id/reject', authenticateToken, roleCheck(['admin', 'owner', 'manager']), rejectResetRequest);

router.delete('/:id', authenticateToken, roleCheck(['admin', 'owner', 'manager']), deleteResetRequest);

router.post ('/reset-password', resetPassword);

module.exports = router;