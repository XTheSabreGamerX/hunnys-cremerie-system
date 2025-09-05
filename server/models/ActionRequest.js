const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ['Inventory', 'Sales', 'Supplier', 'Customer'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'moduleRef',
  },
  moduleRef: {
    type: String,
    required: true,
    enum: ['InventoryItem', 'Sale', 'Supplier', 'Customer'],
  },
  requestType: {
    type: String,
    required: true,
    enum: ['edit', 'delete', 'restock'],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('ActionRequest', requestSchema);