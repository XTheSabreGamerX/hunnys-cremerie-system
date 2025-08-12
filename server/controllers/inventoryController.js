const InventoryItem = require("../models/InventoryItem");
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
      .sort({ itemId: 1 });

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
    const item = new InventoryItem(req.body);
    await item.save();

    try {
      await createLog({
        action: 'Added Item',
        module: 'Inventory',
        description: `An inventory item was added: ${item.name}`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error('[Activity Log] Failed to log addition:', logErr.message);
    }

    res.status(201).json(item);
  } catch (err) {
    console.error('Add item failed:', err);
    res.status(500).json({ error: 'Failed to add item.' });
  }
};

// Updating an inventory item
const updateInventoryItem = async (req, res) => {
  try {
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
        action: 'Updated Item',
        module: 'Inventory',
        description: `User ${req.user.username} updated an item: ${updated.name}`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error('[Activity Log] Failed to log update:', logErr.message);
    }

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update item." });
  }
};

// Deleting an inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    try {
      await createLog({
        action: 'Deleted Item',
        module: 'Inventory',
        description: `User ${req.user.username} deleted an item: ${deletedItem.name}`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error('[Activity Log] Failed to log deletion:', logErr.message);
    }

    res.status(200).json({ message: 'Item has been deleted successfully' });
  } catch (err) {
    console.error('[DELETE] Server error:', err.message);
    res.status(500).json({ message: 'Server error during deletion' });
  }
};

// Periodic update for status
const batchUpdateStatuses = async () => {
  try {
    const items = await InventoryItem.find();

    for (const item of items) {
      const newStatus = computeStatus(item);
      if (item.status !== newStatus) {
        item.status = newStatus;
        await item.save();
      }
    }
    console.log('Batch status update complete');
  } catch (error) {
    console.error('Error during batch status update:', error);
  }
};

module.exports = {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  batchUpdateStatuses,
};
