const ActivityLog = require("../models/ActivityLog");

const getAllLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'username isActive role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({logs});
  } catch (err) {
    console.error('Error fetching logs:', err.message, err);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

const createLog = async ({ action, module, description, userId }) => {
  try {
    const newLog = new ActivityLog({
      action,
      module,
      description,
      userId: userId,
    });
    await newLog.save();
  } catch (err) {
    console.error("Failed to create activity log:", err.message);
  }
};

module.exports = {
  getAllLogs,
  createLog
}