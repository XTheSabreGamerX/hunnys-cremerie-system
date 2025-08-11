const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/auth')
const {
  createResetRequest,
  getResetRequests,
  approveResetRequest,
  rejectResetRequest,
  deleteResetRequest
} = require("../controllers/resetRequestController");

router.post('/', createResetRequest);

router.get('/', authenticateToken, getResetRequests);

router.put('/:id/approve', authenticateToken, approveResetRequest);

router.put('/:id/reject', authenticateToken, rejectResetRequest);

router.delete('/:id', authenticateToken, deleteResetRequest);

module.exports = router;