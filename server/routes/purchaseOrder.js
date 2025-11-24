const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createPurchaseOrder,
  getAllPurchaseOrders,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} = require('../controllers/purchaseOrderController');

// ---------------- CREATE PO ----------------
router.post('/', authenticateToken, roleCheck(['admin', 'owner', 'manager']), createPurchaseOrder);

// ---------------- GET POs ----------------
router.get('/', authenticateToken, roleCheck(['admin', 'owner', 'manager']), getAllPurchaseOrders);

// ---------------- RECEIVE ITEMS ----------------
router.put('/receive/:poId', authenticateToken, roleCheck(['admin', 'owner', 'manager']), receivePurchaseOrder);

// ---------------- CANCEL PO ----------------
router.put('/cancel/:poId', authenticateToken, roleCheck(['admin', 'owner', 'manager']), cancelPurchaseOrder);

module.exports = router;
