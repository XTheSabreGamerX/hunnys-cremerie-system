const express = require('express');
const router = express.Router();
const { getAllLogs } = require('../controllers/activityLogController');
const roleCheck = require('../middleware/roleCheck');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getAllLogs);

module.exports = router;