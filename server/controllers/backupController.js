const InventoryItem = require("../models/InventoryItem");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const Sale = require("../models/Sale");

// Generate File name
const generateBackupFileName = (modelName, user, date = new Date()) => {
  const downloadedBy = user.username || "Unknown";
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
  return `${modelName}-backup-${dateStr}_${timeStr}_${downloadedBy}.json`;
};

// Inventory Backup
const backupInventory = async (req, res) => {
  try {
    const inventoryItems = await InventoryItem.find().lean();
    const timestamp = new Date();

    const backupData = {
      metadata: {
        timestamp: timestamp.toISOString(),
        downloadedBy: req.user.username,
        totalItems: inventoryItems.length,
      },
      inventoryItems,
    };

    const fileName = generateBackupFileName("inventory", req.user, timestamp);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error("Error backing up inventory:", error);
    res
      .status(500)
      .json({ message: "Failed to backup inventory", error: error.message });
  }
};

// Inventory Restore
const restoreInventory = async (req, res) => {
  try {
    const { inventoryItems } = req.body;

    if (!inventoryItems || !Array.isArray(inventoryItems)) {
      return res.status(400).json({ message: "Invalid backup file format" });
    }

    await InventoryItem.deleteMany({});
    await InventoryItem.insertMany(inventoryItems);

    res.status(200).json({
      message: "Inventory restored successfully",
      restoredCount: inventoryItems.length,
    });
  } catch (error) {
    console.error("Error restoring inventory:", error);
    res
      .status(500)
      .json({ message: "Failed to restore inventory", error: error.message });
  }
};

// Customer Backup
const backupCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().lean();
    const timestamp = new Date();

    const backupData = {
      metadata: {
        timestamp: timestamp.toISOString(),
        downloadedBy: req.user.username,
        totalItems: customers.length,
      },
      customers,
    };

    const fileName = generateBackupFileName("customers", req.user, timestamp);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error("Error backing up customers:", error);
    res
      .status(500)
      .json({ message: "Failed to backup customers", error: error.message });
  }
};

// Customer Restore
const restoreCustomers = async (req, res) => {
  try {
    const { customers } = req.body;

    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ message: "Invalid backup file format" });
    }

    await Customer.deleteMany({});
    await Customer.insertMany(customers);

    res.status(200).json({
      message: "Customers restored successfully",
      restoredCount: customers.length,
    });
  } catch (error) {
    console.error("Error restoring customers:", error);
    res
      .status(500)
      .json({ message: "Failed to restore customers", error: error.message });
  }
};

// Supplier Backup
const backupSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().lean();
    const timestamp = new Date();

    const backupData = {
      metadata: {
        timestamp: timestamp.toISOString(),
        downloadedBy: req.user.username,
        totalItems: suppliers.length,
      },
      suppliers,
    };

    const fileName = generateBackupFileName("suppliers", req.user, timestamp);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error("Error backing up suppliers:", error);
    res
      .status(500)
      .json({ message: "Failed to backup suppliers", error: error.message });
  }
};

// Supplier Restore
const restoreSuppliers = async (req, res) => {
  try {
    const { suppliers } = req.body;

    if (!suppliers || !Array.isArray(suppliers)) {
      return res.status(400).json({ message: "Invalid backup file format" });
    }

    await Supplier.deleteMany({});
    await Supplier.insertMany(suppliers);

    res.status(200).json({
      message: "Suppliers restored successfully",
      restoredCount: suppliers.length,
    });
  } catch (error) {
    console.error("Error restoring suppliers:", error);
    res
      .status(500)
      .json({ message: "Failed to restore suppliers", error: error.message });
  }
};

// Purchase Order Backup
const backupPO = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.find().lean();
    const timestamp = new Date();

    const backupData = {
      metadata: {
        timestamp: timestamp.toISOString(),
        downloadedBy: req.user.username,
        totalItems: purchaseOrder.length,
      },
      purchaseOrder,
    };

    const fileName = generateBackupFileName("purchaseOrder", req.user, timestamp);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error("Error backing up purchase order:", error);
    res
      .status(500)
      .json({ message: "Failed to backup purchase order", error: error.message });
  }
};

// Purchase Order Restore
const restorePO = async (req, res) => {
  try {
    const { purchaseOrder } = req.body;

    if (!purchaseOrder || !Array.isArray(purchaseOrder)) {
      return res.status(400).json({ message: "Invalid backup file format" });
    }

    await PurchaseOrder.deleteMany({});
    await PurchaseOrder.insertMany(purchaseOrder);

    res.status(200).json({
      message: "Purchase Order restored successfully",
      restoredCount: purchaseOrder.length,
    });
  } catch (error) {
    console.error("Error restoring purchase order:", error);
    res
      .status(500)
      .json({ message: "Failed to restore purchase order", error: error.message });
  }
};

// Sale Backup
const backupSale = async (req, res) => {
  try {
    const sales = await Sale.find().lean();
    const timestamp = new Date();

    const backupData = {
      metadata: {
        timestamp: timestamp.toISOString(),
        downloadedBy: req.user.username,
        totalItems: sales.length,
      },
      sales,
    };

    const fileName = generateBackupFileName("sale", req.user, timestamp);

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error("Error backing up sale:", error);
    res
      .status(500)
      .json({ message: "Failed to backup sale", error: error.message });
  }
};

// Sale Restore
const restoreSale = async (req, res) => {
  try {
    const { sales } = req.body;

    if (!sales || !Array.isArray(sales)) {
      return res.status(400).json({ message: "Invalid backup file format" });
    }

    await Sale.deleteMany({});
    await Sale.insertMany(sales);

    res.status(200).json({
      message: "Sale restored successfully",
      restoredCount: sales.length,
    });
  } catch (error) {
    console.error("Error restoring sale:", error);
    res
      .status(500)
      .json({ message: "Failed to restore sale", error: error.message });
  }
};


module.exports = {
  backupInventory,
  restoreInventory,
  backupCustomers,
  restoreCustomers,
  backupSuppliers,
  restoreSuppliers,
  backupPO,
  restorePO,
  backupSale,
  restoreSale,
};
