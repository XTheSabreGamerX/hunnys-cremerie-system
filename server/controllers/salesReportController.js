const Sale = require("../models/Sale");
const Acquisition = require("../models/Acquisition");

const getSalesRecords = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "20", 10), 1);

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1); // include entire endDate
      filter.createdAt = { $gte: start, $lt: end };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Sale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sale.countDocuments(filter),
    ]);

    res.json({
      page,
      pageSize: records.length,
      total,
      totalPages: Math.ceil(total / limit),
      records,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const [sales, totalTransactions] = await Promise.all([
      Sale.aggregate([
        { $match: filter },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ]),
      Sale.countDocuments(filter),
    ]);

    const bestSelling = await Sale.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const paymentBreakdown = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json({
      totalSales: sales[0]?.totalSales || 0,
      totalTransactions,
      bestSelling,
      paymentBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTotalProfit = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Filters for sales and acquisitions
    const saleFilter = {};
    const acqFilter = { status: "Delivered" };

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date();
      end.setDate(end.getDate() + 1); // include entire endDate
      saleFilter.createdAt = { $gte: start, $lt: end };
      acqFilter.createdAt = { $gte: start, $lt: end };
    }

    // Fetch sales
    const sales = await Sale.find(saleFilter);

    const totalSales = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0
    );

    const totalSoldCost = sales.reduce((sum, s) => {
      const itemCost = (s.items || []).reduce(
        (acc, item) => acc + (Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0),
        0
      );
      return sum + itemCost;
    }, 0);

    // Fetch acquisitions
    const acquisitions = await Acquisition.find(acqFilter);
    const totalAcquisitionCost = acquisitions.reduce(
      (sum, a) => sum + (Number(a.totalAmount) || 0),
      0
    );

    // Calculate total profit
    const totalProfit = totalSales - totalSoldCost - totalAcquisitionCost;

    res.json({
      totalSales,
      totalSoldCost,
      totalAcquisitionCost,
      totalProfit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSalesRecords,
  getSalesAnalytics,
  getTotalProfit,
};
