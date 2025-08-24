const Inventory = require("../models/InventoryItem.js");
const Sales = require("../models/Sale.js");
const ActivityLog = require("../models/ActivityLog.js");

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getDashboardStats = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });

    const [
      totalInventoryCount,
      lowStockCount,
      outOfStockCount,
      salesToday,
      activityLogsToday,
    ] = await Promise.all([
      Inventory.countDocuments(),

      Inventory.countDocuments({ status: "Low-stock" }),

      Inventory.countDocuments({ status: "Out of stock" }),

      Sales.aggregate([
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: "Asia/Manila",
                  },
                },
                todayStr,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
      ]).then((result) => result[0]?.total || 0),

      ActivityLog.countDocuments({
        $expr: {
          $eq: [
            {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Manila",
              },
            },
            todayStr,
          ],
        },
      }),
    ]);

    res.json({
      totalInventoryCount,
      lowStockCount,
      outOfStockCount,
      salesToday,
      activityLogsToday,
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getRevenueCostByDay = async (req, res) => {
  try {
    // Aggregate revenue
    const revenueData = await Sales.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Aggregate cost
    const costData = await Sales.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalCost: { $sum: { $multiply: ["$items.purchasePrice", "$items.quantity"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Define a fixed start date (e.g., 7 days ago)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // last 7 days

    // Map existing data for quick lookup
    const revenueMap = new Map(revenueData.map(d => [d._id, d.totalRevenue]));
    const costMap = new Map(costData.map(d => [d._id, d.totalCost]));

    // Fill in all dates in the range
    const filledData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      filledData.push({
        date: key,
        revenue: revenueMap.get(key) || 0,
        cost: costMap.get(key) || 0,
      });
    }

    res.json(filledData);
  } catch (err) {
    console.error("Error fetching revenue/cost by day:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueCostByDay,
};
