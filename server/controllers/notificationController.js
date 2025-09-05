const Notification = require("../models/Notification");

// Create notifications
const createNotification = async ({
  message,
  type = "info",
  roles = [],
  userId = null,
  isGlobal = null,
}) => {
  if (!message) throw new Error("Message is required");

  const finalIsGlobal = isGlobal !== null ? isGlobal : !roles.length && !userId;

  const notification = new Notification({
    message,
    type,
    roles,
    userId: userId || null,
    isGlobal: finalIsGlobal,
  });

  return await notification.save();
};

// Get notifications for the current user
const getUserNotifications = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId =req.user.id?.toString();
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

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking all as read", error });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
