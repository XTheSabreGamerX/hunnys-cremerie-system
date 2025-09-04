const Customer = require("../models/Customer");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

// Get all Customers
const getAllCustomers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const total = await Customer.countDocuments();
    const customers = await Customer.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ customerId: 1 });

    res.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Failed to get customers:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Add Customer
const createCustomer = async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();

    try {
      await createLog({
        action: "Added Customer",
        module: "Customer Management",
        description: `User ${req.user.username} added a customer: ${newCustomer.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `A new customer was created: ${newCustomer.name}.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log update:", logErr.message);
    }

    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(400).json({ message: "Failed to create customer" });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      timestamps: true,
    });

    try {
      await createLog({
        action: "Updated Customer",
        module: "Customer Management",
        description: `User ${req.user.username} updated a customer: ${updated.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `A customer was updated: ${updated.name}.`,
        type: "info",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log update:", logErr.message);
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Update failed" });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    try {
      await createLog({
        action: "Deleted Customer",
        module: "Customer Management",
        description: `User ${req.user.username} deleted a customer: ${deletedCustomer.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `A customer was deleted: ${deleteCustomer.name}.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log deletion:", logErr.message);
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("[DELETE] Customer deletion error:", err.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = {
  getAllCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
