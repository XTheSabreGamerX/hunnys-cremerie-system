const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth')
const {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  repackInventoryItem,
  batchUpdateStatuses,
} = require('../controllers/inventoryController');

// Routes for Inventory
router.get('/', authenticateToken, getAllInventoryItems);

router.post('/', authenticateToken, addInventoryItem);

router.put('/:id', authenticateToken, updateInventoryItem);

router.delete('/:id', authenticateToken, deleteInventoryItem);

router.post('/repack', authenticateToken, repackInventoryItem);

router.post('/inventory/check-status', batchUpdateStatuses);

module.exports = router;