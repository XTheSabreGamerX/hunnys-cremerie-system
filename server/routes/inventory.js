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

module.exports = router;