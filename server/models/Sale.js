const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: Number, required: true, unique: true },
    customerName: { type: String },
    orderType: {
      type: String,
      enum: ["Walk-in", "Online"],
      default: "Online",
      required: true,
    },
    items: [
      {
        itemId: String,
        name: String,
        quantity: Number,
        sellingPrice: Number,
      },
    ],
    subtotal: { type: Number },
    taxRate: { type: Number },
    taxAmount: { type: Number },
    totalAmount: { type: Number, required: true },
    refund: {
      status: {
        type: String,
        enum: ["refunded", "defective", "replaced"],
        default: null,
      },
      reason: { type: String },
      refundedItems: [
        {
          itemId: String,
          name: String,
          quantity: Number,
          sellingPrice: Number,
        },
      ],
      totalRefundAmount: { type: Number, default: 0 },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      processedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);
