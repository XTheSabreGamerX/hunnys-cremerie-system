const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: String, unique: true },
  name: { type: String, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  boughtForPrice: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  supplier: { type: String },
  expirationDate: { type: Date },
  restockThreshold: { type: Number, default: 5 },
  status: {
    type: String,
    enum: ["Well-stocked", "Low-stock", "Out of stock", "Expired"],
    default: "Well-stocked",
  },
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);