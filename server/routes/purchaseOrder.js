const express = require("express");
const router = express.Router();
const {
  createPurchaseOrder,
  getPurchaseOrderById,
  generateSupplierLink,
  supplierReview,
  approvePurchaseOrder,
  receiveStock,
} = require("../controllers/purchaseOrderController");
const authenticateToken = require("../middleware/auth");

router.post("/", authenticateToken, createPurchaseOrder);

router.get("/:id", authenticateToken, getPurchaseOrderById);

router.post("/:id/generate-link", authenticateToken, generateSupplierLink);

router.post("/:id/approve", authenticateToken, approvePurchaseOrder);

router.post("/:id/receive-stock", authenticateToken, receiveStock);

// ------------------------
// Supplier Route via Temporary Link
// ------------------------

// Supplier reviews a PO using temporary token
router.post("/review/:token", supplierReview);

module.exports = router;