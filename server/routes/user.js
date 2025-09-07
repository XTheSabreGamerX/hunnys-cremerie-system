const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getAllUsers,
  deactivateUser,
  reactivateUser,
  updateUser
} = require('../controllers/userController');

// Gets all user details
router.get('/', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getAllUsers);

// Deactivate user account
router.put('/deactivate/:id', authenticateToken, roleCheck(['admin', 'owner', 'manager']), deactivateUser);

// Reactivate user account
router.post('/reactivate/:id', authenticateToken, roleCheck(['admin', 'owner', 'manager']), reactivateUser);

// Update user account
router.put('/update/:id', authenticateToken, roleCheck(['admin', 'owner', 'manager']), updateUser);

module.exports = router;