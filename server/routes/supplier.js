const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
    getAllSuppliers,
    getPaginatedSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
} = require ('../controllers/supplierController');

router.get('/', authenticateToken, getAllSuppliers);

router.get('/paginated', authenticateToken, getPaginatedSuppliers);

router.post('/', authenticateToken, createSupplier);

router.put('/:id', authenticateToken, updateSupplier);

router.delete('/:id', authenticateToken, deleteSupplier);

module.exports = router;