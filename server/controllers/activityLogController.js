const ActivityLog = require("../models/ActivityLog");

const getAllLogs = async (req, res) => {
  try {
    const { range } = req.query;
    let dateFilter = {};

    if (range && range !== 'All') {
      const now = new Date();
      let startDate;

      switch (range) {
        case 'Today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'This Week':
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          firstDayOfWeek.setHours(0, 0, 0, 0);
          startDate = firstDayOfWeek;
          break;
        case 'This Month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'This Year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        dateFilter = { createdAt: { $gte: startDate } };
      }
    }

    const logs = await ActivityLog.find(dateFilter)
      .populate('userId', 'username isActive role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ logs });
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