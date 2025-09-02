const InventoryItem = require("../models/InventoryItem");
const UnitOfMeasurement = require("../models/UnitOfMeasurement");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");

// Computes inventory item status
function computeStatus(item) {
  const now = new Date();

  if (item.expirationDate && new Date(item.expirationDate) < now) {
    return "Expired";
  }

  if (item.stock <= 0) {
    return "Out of stock";
  }

  if (item.stock <= (item.restockThreshold ?? 5)) {
    return "Low-stock";
  }

  return "Well-stocked";
}

// GET all inventory items
const getAllInventoryItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await InventoryItem.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    const items = await InventoryItem.find()
      .skip(skip)
      .limit(limit)
      .sort({ itemId: 1 })
      .populate("unit", "name")
      .populate("createdBy", "username");

    res.json({
      items,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error("Server error while fetching inventory:", err);
    res.status(500).json({ message: "Server error while fetching inventory" });
  }
};

// Adding a new inventory item
const addInventoryItem = async (req, res) => {
  try {
    const item = new InventoryItem({
      ...req.body,
      createdBy: req.user.id,
    });

    await item.save();

    try {
      await createLog({
        action: "Added Item",
        module: "Inventory",
        description: `An inventory item was added: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An inventory item "${item.name}" was created.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log addition:", logErr.message);
    }

    res.status(201).json(item);
  } catch (err) {
    console.error("Add item failed:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: err.message || "Failed to add item." });
  }
};

// Updating an inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    Object.assign(item, req.body);

    if (item.unitPrice < item.purchasePrice) {
      return res.status(400).json({
        message: "Unit Price must be greater than or equal to Purchase Price",
      });
    }

    await item.save();

    try {
      await createLog({
        action: "Updated Item",
        module: "Inventory",
        description: `User ${req.user.username} updated an item: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An inventory item "${item.name}" was edited.`,
        type: "info",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log update:", logErr.message);
    }

    res.json(item);
  } catch (err) {
    console.error("Update error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: err.message || "Failed to update item." });
  }
};
/*const updateInventoryItem = async (req, res) => {
  try {
    const { unitPrice, purchasePrice } = req.body;

    if (unitPrice !== undefined && purchasePrice !== undefined) {
      if (unitPrice < purchasePrice) {
        return res.status(400).json({
          error: "Unit Price must be greater than or equal to Purchase Price",
        });
      }
    }

    const updated = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }

    try {
      await createLog({
        action: "Updated Item",
        module: "Inventory",
        description: `User ${req.user.username} updated an item: ${updated.name}`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log update:", logErr.message);
    }

    await Notification.create({
      roles: ["admin", "owner", "manager"],
      isGlobal: false,
      message: `An inventory item "${updated.name}" was edited.`,
      type: "info",
    });

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ error: "Failed to update item." });
  }
};*/

// Deleting an inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    try {
      await createLog({
        action: "Deleted Item",
        module: "Inventory",
        description: `User ${req.user.username} deleted an item: ${deletedItem.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An inventory item "${deletedItem.name}" was deleted.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log deletion:", logErr.message);
    }

    res.status(200).json({ message: "Item has been deleted successfully" });
  } catch (err) {
    console.error("[DELETE] Server error:", err.message);
    res.status(500).json({ message: "Server error during deletion" });
  }
};

// Periodic update for status
const batchUpdateStatuses = async () => {
  try {
    const items = await InventoryItem.find();

    const systemUserId = "6891c3c178b2ff675c9cdfd7";

    for (const item of items) {
      const newStatus = computeStatus(item);
      if (!item.createdBy) {
        item.createdBy = systemUserId;
      }

      if (item.status !== newStatus) {
        item.status = newStatus;
        await item.save();
      }
    }
    console.log("Batch status update complete");
  } catch (error) {
    console.error("Error during batch status update:", error);
  }
};

// Get all Units of Measurement
const getAllUoms = async (req, res) => {
  try {
    const uoms = await UnitOfMeasurement.find().sort({ name: 1 });
    res.json(uoms);
  } catch (err) {
    console.error("Error fetching UoMs:", err.message);
    res.status(500).json({ message: "Server error fetching UoMs" });
  }
};

// Create new Unit of Measurement
const createUom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Unit name is required" });
    }

    const existing = await UnitOfMeasurement.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "Unit already exists" });
    }

    const uom = new UnitOfMeasurement({
      name,
    });

    await uom.save();
    res.status(201).json(uom);
  } catch (err) {
    console.error("Error creating UoM:", err.message);
    res.status(500).json({ message: "Server error creating UoM" });
  }
};

// Update Unit of Measurement
const updateUom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const uom = await UnitOfMeasurement.findById(id);
    if (!uom) {
      return res.status(404).json({ message: "Unit not found" });
    }

    if (name && name !== uom.name) {
      const exists = await UnitOfMeasurement.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ message: "Another unit with this name already exists" });
      }
      uom.name = name;
    }

    await uom.save();
    res.json(uom);
  } catch (err) {
    console.error("Error updating UoM:", err.message);
    res.status(500).json({ message: "Server error updating UoM" });
  }
};

module.exports = {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  batchUpdateStatuses,
  getAllUoms,
  createUom,
  updateUom,
};
