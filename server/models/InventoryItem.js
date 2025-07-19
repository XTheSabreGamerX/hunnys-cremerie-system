const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
	itemId: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	stock: { type: Number, default: 0 },
	category: { type: String, },
	unitPrice: { type: Number, default: 0 },
	supplier: { type: String },
	expirationDate: { type: Date }
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);