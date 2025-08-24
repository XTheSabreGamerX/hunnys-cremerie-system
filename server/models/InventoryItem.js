const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: String, unique: true },
  name: { type: String, required: true },
  stock: { type: Number, min: 0, default: 0 },
  category: { type: String },
  purchasePrice: { type: Number, min: 0, default: 0 },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (value) {
        return value >= this.purchasePrice;
      },
      message: 'Unit Price must be greater than or equal to Purchase Price',
    },
  },
  unit: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UnitOfMeasurement'
  },
  supplier: { type: String },
  restockThreshold: { type: Number, default: 0 },
  expirationDate: { type: Date },
  status: {
    type: String,
    enum: ["Well-stocked", "Low-stock", "Out of stock", "Expired"],
    default: "Well-stocked",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
