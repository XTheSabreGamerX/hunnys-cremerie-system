const mongoose = require('mongoose');
const { Schema } = mongoose;

const PurchaseOrderSchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    items: [
      {
        inventoryItem: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        quantity: { type: Number, required: true },
        proposedPrice: { type: Number, required: true }, // Initial price from system
        supplierPrice: { type: Number }, // Editable by supplier
        isAvailable: { type: Boolean, default: true }, // Supplier marks availability
      },
    ],
    note: { type: String },
    supplierNote: { type: String }, // Optional note from supplier after review
    status: {
      type: String,
      enum: ['Pending', 'Awaiting Approval', 'Approved', 'Partial', 'Completed', 'Rejected'],
      default: 'Pending',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    temporaryLinkToken: { type: String }, // Token for supplier review link
    temporaryLinkExpires: { type: Date }, // Expiry of supplier link
    receivedItems: [
      {
        inventoryItem: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },
        quantityReceived: { type: Number },
        receivedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);