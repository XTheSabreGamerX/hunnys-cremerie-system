const Notification = require("../models/Notification");

// Create notifications
const createNotification = async ({
  message,
  type = "info",
  roles = [],
  userId = null,
  isGlobal = null,
  eventType = "general",
}) => {
  if (!message) throw new Error("Message is required");

  const finalIsGlobal = isGlobal !== null ? isGlobal : !roles.length && !userId;

  const notification = new Notification({
    message,
    type,
    roles,
    userId: userId || null,
    isGlobal: finalIsGlobal,
    eventType,
  });

  return await notification.save();
};

// Get notifications for the current user
const getUserNotifications = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id?.toString();
    const userRole = user.role;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orConditions = [{ isGlobal: true }, { roles: { $in: [userRole] } }];

    if (userId) {
      orConditions.push({ userId: userId });
    }

    const query = { $or: orConditions };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
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

// Mark all notifications for this user as read
/* const markAllAsRead = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = req.user.id.toString();
    const result = await Notification.updateMany(
      { read: false, userId },
      { $set: { read: true } }
    );

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in markAllAsRead:", error);
    res.status(500).json({
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
}; */

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const count = await Notification.countDocuments({
      read: false,
      $or: [{ userId }, { roles: { $in: [userRole] } }, { isGlobal: true }],
    });

    res.json({ unreadCount: count });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res
      .status(500)
      .json({ message: "Error getting unread count", error: err.message });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead /* 
  markAllAsRead, */,
  getUnreadCount,
};
