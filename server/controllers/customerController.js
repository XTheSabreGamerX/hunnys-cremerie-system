const Customer = require('../models/Customer');

// Get all Customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add Customer
const createCustomer = async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create customer' });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, timestamps: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Update failed' });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed' });
  }
};

module.exports = {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};