const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const {
  getAllSalesPaginated,
  getAllSales,
  getSaleById,
  createSale,
  refundSale,
} = require("../controllers/saleController");

router.get("/", authenticateToken, getAllSalesPaginated);

router.get("/all", authenticateToken, getAllSales);

router.get("/:id", authenticateToken, getSaleById);

router.post("/", authenticateToken, createSale);

router.post("/:id/refund", authenticateToken, refundSale);

module.exports = router;
