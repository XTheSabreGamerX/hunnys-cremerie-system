const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/auth')
const {
  createResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
} = require("../controllers/resetRequestController");

router.post('/', createResetRequest);

router.get('/', authenticateToken, getResetRequests);

router.put('/:id/approve', authenticateToken, approveResetRequest);

router.delete('/:id/reject', authenticateToken, rejectResetRequest);

module.exports = router;