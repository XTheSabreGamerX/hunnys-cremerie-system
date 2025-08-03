const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth')
const {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');

// Routes
router.get('/', authenticateToken, getAllInventoryItems);

router.post('/', authenticateToken, addInventoryItem);

router.put('/:id', authenticateToken, updateInventoryItem);

router.delete('/:id', authenticateToken, deleteInventoryItem);

module.exports = router;