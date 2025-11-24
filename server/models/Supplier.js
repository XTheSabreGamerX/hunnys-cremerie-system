const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplierId: { type: String, unique: true },
    name: { type: String, required: true },
    email: {
      type: String,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please fill a valid email address",
      ],
    },
    contactPerson: { type: String, trim: true },
    contactNumber: { type: String },

    itemsSupplied: [
      {
        inventoryItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        purchasePrice: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
