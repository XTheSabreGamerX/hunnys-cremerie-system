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

//Add Item route
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

//Edit item route
router.put('/:id', async (req, res) => {
	try {
		const updated = await InventoryItem.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);
		if (!updated) {
			return res.status(404).json({ error: 'Item not found' });
		}
		res.json(updated);
	} catch (err) {
		console.error('Update error:', err);
		res.status(500).json({ error: 'Failed to update item.' });
	}
});

//Delete item route
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