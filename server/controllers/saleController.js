const Sale = require("../models/Sale");
const Inventory = require("../models/InventoryItem");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

// GET function to get all sales
const getAllSalesPaginated = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const total = await Sale.countDocuments();
    const sales = await Sale.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Failed to get sales:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET function to get all sales without pagination
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });

    res.json({
      sales,
      total: sales.length,
    });
  } catch (err) {
    console.error("Failed to get all sales data:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET function to get a single sale by ID
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.status(200).json(sale);
  } catch (err) {
    res.status(500).json({ message: "Error fetching sale", error: err });
  }
};

// POST function to create a new sale
const createSale = async (req, res) => {
  try {
    // Validate inventory items exist and prepare sale items
    const saleItems = await Promise.all(
      req.body.items.map(async (item) => {
        const inventoryItem = await Inventory.findById(item.itemId);
        if (!inventoryItem)
          throw new Error(`Inventory item not found: ${item.itemId}`);

        return {
          itemId: inventoryItem._id,
          name: inventoryItem.name,
          quantity: Number(item.quantity),
          sellingPrice: Number(item.sellingPrice),
        };
      })
    );

    // Generate incrementing invoice number
    const lastSale = await Sale.findOne().sort({ invoiceNumber: -1 }).exec();
    const nextInvoice = lastSale ? lastSale.invoiceNumber + 1 : 1;

    // Create new sale
    const newSale = new Sale({
      invoiceNumber: nextInvoice,
      customerName: req.body.customerName,
      orderType: req.body.orderType || "Online",
      items: saleItems,
      subtotal: req.body.subtotal,
      taxRate: req.body.taxRate,
      taxAmount: req.body.taxAmount,
      totalAmount: req.body.totalAmount,
    });

    await newSale.save();

    // Update inventory stock and push to stockHistory
    for (const soldItem of saleItems) {
      const inventoryItem = await Inventory.findById(soldItem.itemId);
      if (!inventoryItem) continue;

      const previousStock = inventoryItem.currentStock;
      inventoryItem.currentStock -= soldItem.quantity;
      if (inventoryItem.currentStock < 0) inventoryItem.currentStock = 0;

      inventoryItem.stockHistory = inventoryItem.stockHistory || [];
      inventoryItem.stockHistory.push({
        type: "Sale",
        quantity: soldItem.quantity,
        previousStock,
        newStock: inventoryItem.currentStock,
        date: new Date(),
        note: `Invoice #: ${newSale.invoiceNumber}`,
      });

      inventoryItem.$locals = { skipLog: true };

      await inventoryItem.save();
    }

    // Create activity log and notification
    try {
      await createLog({
        action: "Created Sale",
        module: "Sales Management",
        description: `User ${req.user.username} created a sale with ${
          saleItems.length
        } item(s) for customer: ${req.body.customerName || "Unknown"}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `User ${req.user.username} created a sale.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error(
        "[Activity Log] Failed to log sale creation:",
        logErr.message
      );
    }

    res.status(201).json({
      message: "Sale recorded and inventory updated successfully",
      sale: newSale,
    });
  } catch (err) {
    console.error("[SALE] Creation error:", err.message);
    res.status(400).json({
      message: "Failed to create sale",
      error: err.message,
    });
  }
};

// POST function to delete and refund a sale
const refundSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Restore stock for each item in the sale
    for (const item of sale.items) {
      const inventoryItem = await Inventory.findById(item.itemId);
      if (inventoryItem) {
        inventoryItem.currentStock += item.quantity;
        await inventoryItem.save();
      } else {
        console.warn(
          `[Refund Warning] Inventory item with ID ${item.itemId} not found`
        );
      }
    }

    // Delete the sale record
    await Sale.findByIdAndDelete(req.params.id);

    // Log refund action
    try {
      await createLog({
        action: "Refunded Sale",
        module: "Sales Management",
        description: `User ${req.user.username} refunded a sale for customer: ${
          sale.customerName || "Unknown"
        }`,
        userId: req.user.id,
      });

      await createNotification({
        message: `User ${req.user.username} refunded a sale for: "${sale.customerName}".`,
        type: "info",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error(
        "[Activity Log] Failed to log sale refund:",
        logErr.message
      );
    }

    res.status(200).json({ message: "Sale refunded successfully" });
  } catch (err) {
    console.error("[Refund Error]", err);
    res.status(500).json({ message: "Error refunding sale", error: err });
  }
};

module.exports = {
  getAllSalesPaginated,
  getAllSales,
  getSaleById,
  createSale,
  refundSale,
};
