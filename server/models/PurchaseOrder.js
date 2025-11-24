const mongoose = require("mongoose");

const PurchaseOrderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
  },

  orderedQty: {
    type: Number,
    required: true,
    min: 1,
  },

  receivedQty: {
    type: Number,
    default: 0,
  },

  purchasePrice: {
    type: Number,
    required: true,
  },

  expirationDate: {
    type: Date,
    default: null,
  },
});

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: Number,
      unique: true,
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    items: [PurchaseOrderItemSchema],

    status: {
      type: String,
      enum: ["Pending", "Partially Delivered", "Completed", "Cancelled"],
      default: "Pending",
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    note: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
