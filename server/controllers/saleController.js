const Fuse = require("fuse.js");
const Sale = require("../models/Sale");
const Inventory = require("../models/InventoryItem");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

// GET function to get all sales with pagination
const getAllSalesPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const normalizedSearch = search.replace(/\s+/g, "");
    const field = req.query.field;
    const order = req.query.order === "desc" ? -1 : 1;
    const fetchAll = req.query.all === "true";

    // Base query (you can add filters here later)
    let allSales = await Sale.find()
      .populate("refund.processedBy", "username")
      .sort(field ? { [field]: order } : { createdAt: -1 });

    // No search → Just paginate normally
    if (!search) {
      const totalItems = allSales.length;
      const totalPages = Math.ceil(totalItems / limit);

      const paginatedItems = fetchAll
        ? allSales
        : allSales.slice((page - 1) * limit, page * limit);

      return res.json({
        items: paginatedItems,
        currentPage: page,
        totalPages,
        totalItems,
      });
    }

    // Normalizer function
    const normalizeFn = (value) =>
      (value?.toString() || "").replace(/\s+/g, "");

    let fuseKeys = [];

    // If a specific column is selected
    if (field) {
      if (["invoiceNumber", "subtotal", "totalAmount"].includes(field)) {
        fuseKeys = [{ name: field, getFn: (s) => normalizeFn(s[field]) }];
      } else if (field === "customerName") {
        fuseKeys = [
          { name: "customerName", getFn: (s) => normalizeFn(s.customerName) },
        ];
      } else if (field === "orderType") {
        fuseKeys = [
          { name: "orderType", getFn: (s) => normalizeFn(s.orderType) },
        ];
      } else if (field === "refund.status") {
        fuseKeys = [
          {
            name: "refund.status",
            getFn: (s) => normalizeFn(s.refund?.status),
          },
        ];
      } else {
        fuseKeys = [field];
      }
    } else {
      // Default fuzzy search across multiple fields
      fuseKeys = [
        {
          name: "invoiceNumber",
          getFn: (s) => normalizeFn(s.invoiceNumber),
        },
        {
          name: "customerName",
          getFn: (s) => normalizeFn(s.customerName),
        },
        {
          name: "orderType",
          getFn: (s) => normalizeFn(s.orderType),
        },
        {
          name: "totalAmount",
          getFn: (s) => normalizeFn(s.totalAmount),
        },
        {
          name: "refund.status",
          getFn: (s) => normalizeFn(s.refund?.status),
        },
      ];
    }

    // Fuse.js fuzzy search
    const fuse = new Fuse(allSales, {
      keys: fuseKeys,
      threshold: 0.4,
      ignoreLocation: true,
    });

    const searchResults = fuse.search(normalizedSearch).map((r) => r.item);

    const totalItems = searchResults.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedResults = fetchAll
      ? searchResults
      : searchResults.slice((page - 1) * limit, page * limit);

    res.json({
      items: paginatedResults,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error("[GET SALES] Server error:", err);
    res.status(500).json({ message: "Server error while fetching sales" });
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

// POST function to process a refund / defective / replaced sale
const refundSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const { status, reason } = req.body;

    if (!["refunded", "defective", "replaced"].includes(status)) {
      return res.status(400).json({ message: "Invalid refund status" });
    }

    // ---- Determine Refund Amount (always based on totalAmount of the sale) ----
    const totalRefundAmount = status === "replaced" ? 0 : sale.totalAmount;

    // ---- Inventory adjustments (ONLY for refunded or defective) ----
    if (status === "refunded" || status === "defective") {
      for (const item of sale.items) {
        const inventoryItem = await Inventory.findById(item.itemId);
        if (inventoryItem) {
          const previousStock = inventoryItem.currentStock;

          inventoryItem.currentStock += item.quantity;

          // Push to stockHistory
          inventoryItem.stockHistory = inventoryItem.stockHistory || [];
          inventoryItem.stockHistory.push({
            type: "Refund",
            quantity: item.quantity,
            previousStock,
            newStock: inventoryItem.currentStock,
            date: new Date(),
            note: `Refund for Sale Invoice #: ${sale.invoiceNumber}`,
          });

          inventoryItem.$locals = { skipLog: true };
          await inventoryItem.save();
        } else {
          console.warn(
            `[Refund Warning] Inventory item with ID ${item.itemId} not found`
          );
        }
      }
    }

    // ---- Apply refund details to the sale ----
    sale.refund = {
      status,
      reason,
      refundedItems: sale.items,
      totalRefundAmount,
      processedBy: req.user.id,
      processedAt: new Date(),
    };

    await sale.save();

    // ---- Logging / Notifications ----
    try {
      await createLog({
        action: `Sale marked as ${status}`,
        module: "Sales Management",
        description: `Sale #${sale.invoiceNumber} has been marked as "${status}" by ${req.user.username}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `Sale #${sale.invoiceNumber} has been marked as "${status}".`,
        type: "info",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed:", logErr.message);
    }

    res.status(200).json({
      message: `Sale successfully marked as ${status}`,
      refund: sale.refund,
    });
  } catch (err) {
    console.error("[Refund Error]", err);
    res.status(500).json({
      message: "Error applying refund action",
      error: err.message,
    });
  }
};

module.exports = {
  getAllSalesPaginated,
  getAllSales,
  getSaleById,
  createSale,
  refundSale,
};
