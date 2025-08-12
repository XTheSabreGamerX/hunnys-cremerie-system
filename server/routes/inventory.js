const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth')
const {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  batchUpdateStatuses,
} = require('../controllers/inventoryController');

// Routes
router.get('/', authenticateToken, getAllInventoryItems);

router.post('/', authenticateToken, addInventoryItem);

router.put('/:id', authenticateToken, updateInventoryItem);

router.delete('/:id', authenticateToken, deleteInventoryItem);

router.post('/inventory/check-status', batchUpdateStatuses);

module.exports = router;