const InventoryItem = require("../models/InventoryItem");

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
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add item." });
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
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json({ message: "Item has deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during deletion" });
  }
};

module.exports = {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};