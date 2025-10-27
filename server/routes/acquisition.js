const express = require('express');
const router = express.Router();
const {
  getAllAcquisitions,
  createAcquisition,
  confirmAcquisition,
  cancelAcquisition,
} = require('../controllers/acquisitionController');
const authenticateToken = require('../middleware/auth.js');
const roleCheck = require('../middleware/roleCheck.js');

// GET all acquisitions (with pagination + fuzzy search)
router.get('/', authenticateToken, roleCheck(['admin', 'owner',]), getAllAcquisitions);

// CREATE new acquisition
router.post('/', authenticateToken, createAcquisition);

// CONFIRM acquisition (convert to inventory)
router.put('/confirm/:id', authenticateToken, roleCheck(['admin', 'owner',]), confirmAcquisition);

// CANCEL acquisition (mark as Cancelled)
router.put('/cancel/:id', authenticateToken, roleCheck(['admin', 'owner',]), cancelAcquisition);

module.exports = router;
