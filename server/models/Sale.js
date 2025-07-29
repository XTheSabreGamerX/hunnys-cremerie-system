const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    saleId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    orderType: { 
      type: String, 
      enum: ["Walk-in", "Online"], 
      default: "Online",
      required: true
    },
    items: [
      {
        itemId: String,
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    subtotal: { type: Number },
    taxRate: { type: Number },
    taxAmount: { type: Number },
    totalAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);