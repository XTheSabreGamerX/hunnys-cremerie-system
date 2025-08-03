const Sale = require("../models/Sale");
const Inventory = require("../models/InventoryItem");

// GET function to get all sales
const getAllSales = async (req, res) => {
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
    console.error('Failed to get sales:', err);
    res.status(500).json({ message: 'Server Error' });
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
    console.log('📥 Incoming sale:', req.body); // <-- Log full incoming sale

    const newSale = new Sale(req.body);
    await newSale.save();

    console.log('✅ Sale saved. Deducting inventory...');

    for (const soldItem of newSale.items) {
      console.log('🔍 Processing item:', soldItem);

      const inventoryItem = await Inventory.findOne({ itemId: soldItem.itemId });
      if (!inventoryItem) {
        console.warn('⚠️ Item not found in inventory:', soldItem.itemId);
        continue;
      }

      inventoryItem.stock -= soldItem.quantity;
      if (inventoryItem.stock < 0) inventoryItem.stock = 0;

      await inventoryItem.save();
    }

    res.status(201).json({
      message: 'Sale recorded and inventory updated successfully',
      sale: newSale,
    });
  } catch (err) {
    console.error('❌ Sale creation error:', err);
    res.status(400).json({
      message: 'Failed to create sale',
      error: err,
    });
  }
};

// PUT function to update a sale
const updateSale = async (req, res) => {
  try {
    const updatedSale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedSale)
      return res.status(404).json({ message: "Sale not found" });
    res.status(200).json({ message: "Sale updated", sale: updatedSale });
  } catch (err) {
    res.status(400).json({ message: "Failed to update sale", error: err });
  }
};

// DELETE function to delete a sale
const deleteSale = async (req, res) => {
  try {

    const deletedSale = await Sale.findByIdAndDelete(req.params.id);

    if (!deletedSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting sale', error: err });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};