const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getAllUsers,
  deactivateUser,
  reactivateUser,
  updateUser
} = require('../controllers/userController');

// Gets all user details
router.get('/', authenticateToken, getAllUsers);

// Deactivate user account
router.put('/deactivate/:id', authenticateToken, deactivateUser);

// Reactivate user account
router.post('/reactivate/:id', authenticateToken, reactivateUser);

// Update user account
router.put('/update/:id', authenticateToken, updateUser);

module.exports = router;