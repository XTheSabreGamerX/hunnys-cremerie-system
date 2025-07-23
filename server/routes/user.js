const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deactivateUser,
  reactivateUser,
  updateUser
} = require('../controllers/userController');

// Gets all user details
router.get('/', getAllUsers);

// Deactivate user account
router.put('/deactivate/:id', deactivateUser);

// Reactivate user account
router.post('/reactivate/:id', reactivateUser);

// Update user account
router.put('/update/:id', updateUser);

module.exports = router;