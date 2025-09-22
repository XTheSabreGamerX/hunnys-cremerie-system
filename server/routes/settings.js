const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const {
  getAllUoms,
  createUom,
  updateUom,
  deleteUom,
  getAllCakeSizes,
  addCakeSize,
  updateCakeSize,
  deleteCakeSize,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/settingsController");

// Unit Of Measurement Routes
router.get("/uom", authenticateToken, getAllUoms);
router.post("/uom", authenticateToken, createUom);
router.put("/uom/:id", authenticateToken, updateUom);
router.delete("/uom/:id", authenticateToken, deleteUom);

// Cake Size Routes
router.get("/size", authenticateToken, getAllCakeSizes);
router.post("/size/", authenticateToken, addCakeSize);
router.put("/size/:id", authenticateToken, updateCakeSize);
router.delete("/size/:id", authenticateToken, deleteCakeSize);

// Category Routes
router.get("/category", authenticateToken, getAllCategories);
router.post("/category", authenticateToken, createCategory);
router.put("/category/:id", authenticateToken, updateCategory);
router.delete("/category/:id", authenticateToken, deleteCategory);

module.exports = router;
