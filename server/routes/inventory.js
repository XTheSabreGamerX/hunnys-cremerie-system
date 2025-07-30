const express = require('express');
const router = express.Router();
const {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');

// Routes
router.get('/', getAllInventoryItems);

router.post('/', addInventoryItem);

router.put('/:id', updateInventoryItem);

router.delete('/:id', deleteInventoryItem);

module.exports = router;