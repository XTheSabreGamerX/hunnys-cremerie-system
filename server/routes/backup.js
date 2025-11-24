const express = require("express");
const router = express.Router();
const {
  backupInventory,
  restoreInventory,
  backupCustomers,
  restoreCustomers,
  backupSuppliers,
  restoreSuppliers,
  backupPO,
  restorePO,
  backupSale,
  restoreSale,
} = require("../controllers/backupController");
const authenticateToken = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

// Inventory
router.get('/inventory/backup', authenticateToken, roleCheck(['admin', 'owner']), backupInventory);
router.post('/inventory/restore', authenticateToken, roleCheck(['admin', 'owner']), restoreInventory);

// Customers
router.get('/customers/backup', authenticateToken, roleCheck(['admin', 'owner']), backupCustomers);
router.post('/customers/restore', authenticateToken, roleCheck(['admin', 'owner']), restoreCustomers);

// Suppliers
router.get('/suppliers/backup', authenticateToken, roleCheck(['admin', 'owner']), backupSuppliers);
router.post('/suppliers/restore', authenticateToken, roleCheck(['admin', 'owner']), restoreSuppliers);

// Purchase Order
router.get('/po/backup', authenticateToken, roleCheck(['admin', 'owner']), backupPO);
router.post('/po/restore', authenticateToken, roleCheck(['admin', 'owner']), restorePO);

// Sale
router.get('/sale/backup', authenticateToken, roleCheck(['admin', 'owner']), backupSale);
router.post('/sale/restore', authenticateToken, roleCheck(['admin', 'owner']), restoreSale);

module.exports = router;
