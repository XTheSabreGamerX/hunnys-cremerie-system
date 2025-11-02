const ActivityLog = require("../models/ActivityLog");

const getActivitySummary = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    // If no dates provided, default to all time
    if (!startDate || !endDate || startDate === "All" || endDate === "All") {
      startDate = "2000-01-01";
      endDate = new Date().toISOString();
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // include full end day

    // Aggregate: count actions per module
    const summary = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { module: "$module", action: "$action" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.module",
          actions: {
            $push: { action: "$_id.action", count: "$count" },
          },
          total: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Error generating activity summary:", error);
    return res
      .status(500)
      .json({ message: "Server error while generating report." });
  }
};

module.exports = { getActivitySummary };
