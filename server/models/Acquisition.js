const mongoose = require('mongoose');

const acquisitionSchema = new mongoose.Schema(
  {
    acquisitionId: { type: String, required: true, unique: true },

    supplier: { type: String, required: true },

    items: [
      {
        itemId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitCost: { type: Number, required: true, min: 0 },
      },
    ],

    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true },

    status: {
      type: String,
      enum: ['Pending', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Acquisition', acquisitionSchema);
