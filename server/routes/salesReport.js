const express = require('express');
const router = express.Router();
const { getSalesRecords, getSalesAnalytics, getTotalProfit } = require('../controllers/salesReportController');
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/sales', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getSalesRecords);

router.get('/sales/analytics', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getSalesAnalytics);

router.get('/profit', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getTotalProfit);

module.exports = router;