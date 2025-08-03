const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
} = require("../controllers/saleController");

router.get("/", authenticateToken, getAllSales);

router.get("/:id", authenticateToken, getSaleById);

router.post("/", authenticateToken, createSale);

router.put("/:id", authenticateToken, updateSale);

router.delete("/:id", authenticateToken, deleteSale);

module.exports = router;