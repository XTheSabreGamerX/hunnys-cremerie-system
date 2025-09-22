const express = require("express");
const router = express.Router();
const {
  getAllCakes,
  addCake,
  updateCake,
  deleteCake,
  processCakeSale,
} = require("../controllers/cakeController");
const authenticateToken = require("../middleware/auth");

// CAKE ROUTES
router.get('/', authenticateToken, getAllCakes);
router.post('/add', authenticateToken, addCake);
router.put('/:id', authenticateToken, updateCake);
router.delete('/:id', authenticateToken, deleteCake);
router.post('/:id/sell', authenticateToken, processCakeSale);

module.exports = router;