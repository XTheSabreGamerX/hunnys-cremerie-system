const express = require("express");
const router = express.Router();
const {
  getAllCakeSizes,
  addCakeSize,
  updateCakeSize,
  deleteCakeSize,
  getAllCakes,
  addCake,
  updateCake,
  deleteCake,
  processCakeSale,
} = require("../controllers/cakeController");
const authenticateToken = require("../middleware/auth");

// CAKE SIZE ROUTES
router.get("/size", authenticateToken, getAllCakeSizes);
router.post("/size/add", authenticateToken, addCakeSize);
router.put("/size/update/:id", authenticateToken, updateCakeSize);
router.delete("/size/delete/:id", authenticateToken, deleteCakeSize);

// CAKE ROUTES
router.get('/', authenticateToken, getAllCakes);
router.post('/add', authenticateToken, addCake);
router.put('/:id', authenticateToken, updateCake);
router.delete('/:id', authenticateToken, deleteCake);
router.post('/:id/sell', authenticateToken, processCakeSale);

module.exports = router;