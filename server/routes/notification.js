const express = require("express");
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require("../controllers/notificationController");
const authenticateToken = require('../middleware/auth');

router.post('/', createNotification);

router.get('/', authenticateToken, getUserNotifications);

router.put('/:id', authenticateToken, markAsRead);

/* router.put('/read-all', authenticateToken, markAllAsRead); */

router.get('/unread-count', authenticateToken, getUnreadCount);

module.exports = router;