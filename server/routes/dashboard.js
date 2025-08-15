const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, getDashboardStats);

module.exports = router;