const express = require('express');
const router = express.Router();
const {
  registrationRequest,
  requestApprove,
  requestReject,
  getAllRequests
} = require('../controllers/requestController');

// Create a registration request
router.post('/register', registrationRequest);

// Approve a request (creates a user, deletes the request)
router.post('/approve/:id', requestApprove);

// Reject a request (deletes the request)
router.delete('/reject/:id', requestReject);

// Get all registration requests
router.get('/', getAllRequests);

module.exports = router;