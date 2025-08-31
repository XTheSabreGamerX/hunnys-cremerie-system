const Notification = require("../models/Notification");

// Create notifications
const createNotification = async (req, res) => {
  try {
    const { userId, role, isGlobal, message, type } = req.body;

    const notification = new Notification({
      userId,
      role,
      isGlobal,
      message,
      type,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error creating notification", error });
  }
};

// Get notifications for the current user
const getUserNotifications = async (req, res) => {
  try {
    const user = req.user;

    const notifications = await Notification.find({
      $or: [{ userId: user._id }, { role: user.role }, { isGlobal: true }],
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

// Mark as read notifications
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error updating notification", error });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all as read', error });
  }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead
};