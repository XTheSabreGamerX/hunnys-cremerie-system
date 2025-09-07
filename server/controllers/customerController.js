const Customer = require("../models/Customer");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");
const ActionRequest = require("../models/ActionRequest");

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
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Staff update request
    if (
      req.user.role === "staff" &&
      customer.createdBy?.toString() !== req.user.id
    ) {
      await ActionRequest.create({
        module: "Customer Management",
        moduleRef: "Customer",
        targetId: customer._id.toString(),
        requestType: "edit",
        details: {
          name: customer.name,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          address: customer.address,
          note: "Staff requested to edit this customer",
        },
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Update Customer Request",
        module: "Customer Management",
        description: `User ${req.user.username} requested to update customer: ${customer.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An update request for customer "${customer.name}" is pending approval.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });

      await createNotification({
        message: `Your update request for "${customer.name}" is pending approval.`,
        type: "info",
        userId: req.user.id,
        roles: [],
        isGlobal: false,
      });

      return res.status(200).json({
        message: "Your update request has been sent for approval.",
      });
    }

    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
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
    console.error("[UPDATE] Customer update error:", err.message);
    res.status(400).json({ message: "Update failed" });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Staff delete request
    if (
      req.user.role === "staff" &&
      customer.createdBy?.toString() !== req.user.id
    ) {
      await ActionRequest.create({
        module: "Customer Management",
        moduleRef: "Customer",
        targetId: customer._id.toString(),
        requestType: "delete",
        details: {
          name: customer.name,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          address: customer.address,
          note: "Staff requested to delete this customer",
        },
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Delete Customer Request",
        module: "Customer Management",
        description: `User ${req.user.username} requested to delete customer: ${customer.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `A delete request for customer "${customer.name}" is pending for approval.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });

      await createNotification({
        message: `Your delete request for "${customer.name}" is pending approval.`,
        type: "info",
        userId: req.user.id,
        roles: [],
        isGlobal: false,
      });

      return res.status(200).json({
        message: "Your delete request has been sent for approval.",
      });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);

    try {
      await createLog({
        action: "Deleted Customer",
        module: "Customer Management",
        description: `User ${req.user.username} deleted a customer: ${deletedCustomer.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `A customer was deleted: ${deletedCustomer.name}.`,
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
