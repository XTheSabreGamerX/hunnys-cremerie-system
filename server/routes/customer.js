const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

router.get('/', authenticateToken, getAllCustomers);

router.post('/', authenticateToken, createCustomer);

router.put('/:id', authenticateToken, updateCustomer);

router.delete('/:id', authenticateToken, deleteCustomer);

module.exports = router;