const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
	itemId: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	stock: { type: Number, required: true },
	category: { type: String, required: true },
	unitPrice: { type: Number, required: true },
	supplier: { type: String },
	expirationDate: { type: Date }
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);