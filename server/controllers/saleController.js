const Sale = require("../models/Sale");

// GET function to get all sales
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.status(200).json(sales);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sales", error: err });
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
    const newSale = new Sale(req.body);
    await newSale.save();
    res
      .status(201)
      .json({ message: "Sale recorded successfully", sale: newSale });
  } catch (err) {
    res.status(400).json({ message: "Failed to create sale", error: err });
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
    if (!deletedSale)
      return res.status(404).json({ message: "Sale not found" });
    res.status(200).json({ message: "Sale deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete sale", error: err });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};
