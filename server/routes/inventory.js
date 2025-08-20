const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth')
const {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  batchUpdateStatuses,
  createUom,
  updateUom,
  getAllUoms,
} = require('../controllers/inventoryController');

// Routes for Inventory
router.get('/', authenticateToken, getAllInventoryItems);

router.post('/', authenticateToken, addInventoryItem);

router.put('/:id', authenticateToken, updateInventoryItem);

router.delete('/:id', authenticateToken, deleteInventoryItem);

router.post('/inventory/check-status', batchUpdateStatuses);

// Routes for Unit of Measurement
router.get('/uom', authenticateToken, getAllUoms);

router.post('/uom', authenticateToken, createUom);

router.put('/uom/:id', authenticateToken, updateUom);

module.exports = router;