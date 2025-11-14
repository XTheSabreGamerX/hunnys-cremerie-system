const mongoose = require("mongoose");

const acquisitionSchema = new mongoose.Schema(
  {
    acquisitionId: { type: String, required: true, unique: true },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "UnitOfMeasurement",
          required: true,
        },
        purchasePrice: { type: Number, required: true },
      },
    ],

    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Delivered", "Cancelled"],
      default: "Pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Acquisition", acquisitionSchema);
