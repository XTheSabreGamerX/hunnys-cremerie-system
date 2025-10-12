const express = require('express');
const router = express.Router();
const { backupInventory } = require('../controllers/backupController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/backup/inventory', authenticateToken, roleCheck(['admin', 'owner']), backupInventory);

module.exports = router;