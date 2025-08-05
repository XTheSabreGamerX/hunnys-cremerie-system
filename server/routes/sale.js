const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getAllSales,
  getSaleById,
  createSale,
  deleteSale
} = require("../controllers/saleController");

router.get("/", authenticateToken, getAllSales);

router.get("/:id", authenticateToken, getSaleById);

router.post("/", authenticateToken, createSale);

router.delete("/:id", authenticateToken, deleteSale);

module.exports = router;