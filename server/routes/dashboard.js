const express = require('express');
const router = express.Router();
const { getDashboardStats, getRevenueCostByDay } = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, getDashboardStats);

router.get('/revenue-cost-by-day', authenticateToken, getRevenueCostByDay);

module.exports = router;