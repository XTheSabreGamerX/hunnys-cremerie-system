const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierId: { type: String, unique: true },
  name: { type: String, required: true },
  contact: { type: String },
  company: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);