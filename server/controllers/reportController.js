// controllers/reportController.js
const Sale = require("../models/Sale");
const PurchaseOrder = require("../models/PurchaseOrder");

const getBusinessReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const filter = {};
    if (startDate && endDate && startDate !== "All" && endDate !== "All") {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch Sales
    const sales = await Sale.find(filter).lean();

    // Fetch Purchase Orders, populate items if needed
    const pos = await PurchaseOrder.find(filter)
      .populate("items.item", "name")
      .populate("supplier", "name")
      .lean();

    // Calculate totals
    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalDiscounts = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
    const totalTax = sales.reduce((sum, s) => sum + (s.taxAmount || 0), 0);

    // Refunds: only count if status is set (e.g., refunded/replaced/defective)
    const refundRows = [];
    let totalRefunds = 0;
    sales.forEach((s) => {
      if (s.refund?.status) {
        refundRows.push({
          invoiceNumber: s.invoiceNumber,
          customerName: s.customerName,
          totalRefundAmount: s.refund.totalRefundAmount || 0,
          refundedItems: s.refund.refundedItems || [],
          refundDate: s.refund.processedAt || s.updatedAt,
        });
        totalRefunds += s.refund.totalRefundAmount || 0;
      }
    });

    // Purchase Orders total cost
    const totalPurchaseCost = pos.reduce((sum, po) => {
      const poTotal =
        po.items?.reduce(
          (itemSum, i) =>
            itemSum + (i.purchasePrice || 0) * (i.receivedQty || 0),
          0
        ) || 0;
      return sum + poTotal;
    }, 0);

    const grossProfit = totalSales - totalPurchaseCost - totalRefunds;

    res.json({
      sales,
      refunds: refundRows,
      purchaseOrders: pos,
      totals: {
        totalSales,
        totalDiscounts,
        totalTax,
        totalRefunds,
        totalPurchaseCost,
        grossProfit,
      },
    });
  } catch (err) {
    console.error("[REPORT] Error generating business report:", err.message);
    res.status(500).json({ message: "Failed to generate business report" });
  }
};

module.exports = { getBusinessReport };
