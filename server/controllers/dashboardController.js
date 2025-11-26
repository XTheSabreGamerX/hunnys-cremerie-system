const Sale = require("../models/Sale.js");
const InventoryItem = require("../models/InventoryItem.js");
const PurchaseOrder = require("../models/PurchaseOrder.js");

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1️⃣ Inventory Stats
    const inventoryItems = await InventoryItem.find({ archived: false });

    const totalInventoryCount = inventoryItems.length;
    const lowStockCount = inventoryItems.filter(
      (item) => item.currentStock <= item.threshold && item.status !== "Expired"
    ).length;
    const outOfStockCount = inventoryItems.filter(
      (item) => item.currentStock === 0 && item.status !== "Expired"
    ).length;
    const expiredCount = inventoryItems.filter(
      (item) => item.status === "Expired"
    ).length;

    // 2️⃣ Sales Today
    const salesTodayAgg = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
        },
      },
    ]);
    const salesToday = salesTodayAgg[0]?.totalSales || 0;

    // 3️⃣ Purchase Orders Today
    const purchaseOrdersToday = await PurchaseOrder.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    res.json({
      totalInventoryCount,
      lowStockCount,
      outOfStockCount,
      expiredCount,
      salesToday,
      purchaseOrdersToday,
    });
  } catch (err) {
    console.error("[DASHBOARD STATS] Error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

const getRevenueCostByDay = async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // last 7 days

    // --- Aggregate revenue from sales ---
    const revenueData = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    // --- Aggregate cost from purchase orders ---
    const poCostData = await PurchaseOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: "Cancelled" }, // ignore cancelled POs
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalCost: {
            $sum: { $multiply: ["$items.purchasePrice", "$items.orderedQty"] },
          },
        },
      },
    ]);

    // --- Map for quick lookup ---
    const revenueMap = new Map(revenueData.map((d) => [d._id, d.totalRevenue]));
    const costMap = new Map(poCostData.map((d) => [d._id, d.totalCost]));

    // --- Fill in all dates in range ---
    const filledData = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().split("T")[0];
      filledData.push({
        date: key,
        revenue: revenueMap.get(key) || 0,
        cost: costMap.get(key) || 0,
      });
    }

    res.json(filledData);
  } catch (err) {
    console.error("[DASHBOARD] Error fetching revenue/cost by day:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueCostByDay,
};
