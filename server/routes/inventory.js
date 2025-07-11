const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');

router.get('/', async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error while fetching inventory' });
  }
});

router.post('/', async (req, res) => {
	try {
		const item = new InventoryItem(req.body);
		await item.save();
		res.status(201).json(item);
	} catch (err) {
    console.error(err);
		res.status(500).json({ error: 'Failed to add item.'});
	}
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item has deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during deletion' });
  }
});

module.exports = router;