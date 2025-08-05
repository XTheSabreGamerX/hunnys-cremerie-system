const express = require('express');
const router = express.Router();
const { getAllLogs } = require('../controllers/activityLogController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, getAllLogs);

module.exports = router;