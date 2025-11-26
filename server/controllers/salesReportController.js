const Sale = require("../models/Sale");
const PurchaseOrder = require("../models/PurchaseOrder");

const getTotalSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const filter = {};
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1); // include full endDate
      filter.createdAt = { $gte: start, $lt: end };
    }

    // Fetch sales with the filter
    const sales = await Sale.find(filter);

    // Sum totalAmount, subtract any refunds
    const totalSales = sales.reduce((sum, sale) => {
      const refundAmount = sale.refund?.totalRefundAmount || 0;
      return sum + (Number(sale.totalAmount) - Number(refundAmount));
    }, 0);

    res.json({ totalSales });
  } catch (err) {
    console.error("[GET TOTAL SALES] Server error:", err);
    res
      .status(500)
      .json({ message: "Server error while calculating total sales" });
  }
};

const getTotalProfit = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // --- Sales Filter ---
    const saleFilter = {};
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1); // include full endDate
      saleFilter.createdAt = { $gte: start, $lt: end };
    }

    // --- Purchase Order Filter ---
    const poFilter = { status: { $in: ["Completed", "Partially Delivered"] } };
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1);
      poFilter.createdAt = { $gte: start, $lt: end };
    }

    // --- Fetch Sales ---
    const sales = await Sale.find(saleFilter);
    const totalSales = sales.reduce(
      (sum, s) =>
        sum +
        (Number(s.totalAmount) - Number(s.refund?.totalRefundAmount || 0)),
      0
    );

    // --- Fetch Purchase Orders ---
    const purchaseOrders = await PurchaseOrder.find(poFilter);
    const totalPurchaseCost = purchaseOrders.reduce((sum, po) => {
      const poCost = (po.items || []).reduce(
        (acc, item) =>
          acc +
          (Number(item.purchasePrice) || 0) * (Number(item.receivedQty) || 0),
        0
      );
      return sum + poCost;
    }, 0);

    // --- Profit Calculation ---
    const totalProfit = totalSales - totalPurchaseCost;

    res.json({
      totalSales,
      totalPurchaseCost,
      totalProfit,
    });
  } catch (err) {
    console.error("[GET TOTAL PROFIT] Server error:", err);
    res
      .status(500)
      .json({ message: "Server error while calculating total profit" });
  }
};

const getTopSellingItems = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // --- Date filter ---
    const filter = {};
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1); // include full endDate
      filter.createdAt = { $gte: start, $lt: end };
    }

    // --- Aggregate items ---
    const bestSelling = await Sale.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantitySold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
    ]);

    res.json({ bestSelling });
  } catch (err) {
    console.error("[GET TOP SELLING ITEMS] Server error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching top selling items" });
  }
};

module.exports = {
  getTotalSales,
  getTotalProfit,
  getTopSellingItems,
};
