const express = require('express');
const router = express.Router();
const { getSalesRecords, getSalesAnalytics } = require('../controllers/salesReportController');
const authenticateToken= require('../middleware/auth')

router.get('/sales', authenticateToken, getSalesRecords);

router.get('/sales/analytics', authenticateToken, getSalesAnalytics);

module.exports = router;