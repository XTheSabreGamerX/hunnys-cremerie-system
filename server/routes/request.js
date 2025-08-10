const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth')
const {
  registrationRequest,
  requestApprove,
  requestReject,
  getAllRequests
} = require('../controllers/requestController');

// Create a registration request
router.post('/register', registrationRequest);

// Approve a request (creates a user, deletes the request)
router.post('/approve/:id', authenticateToken, requestApprove);

// Reject a request (deletes the request)
router.delete('/reject/:id', authenticateToken, requestReject);

// Get all registration requests
router.get('/', authenticateToken, getAllRequests);

module.exports = router;