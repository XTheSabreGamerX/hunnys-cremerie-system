const Supplier = require("../models/Supplier");
const { createLog } = require("../controllers/activityLogController");

// GET /api/suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const newSupplier = new Supplier(req.body);
    const savedSupplier = await newSupplier.save();

    try {
      await createLog({
        action: "Created Supplier",
        module: "Supplier Management",
        description: `User ${req.user.username} created a supplier: ${
          savedSupplier.name || "Unknown"
        }`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error(
        "[Activity Log] Failed to log supplier creation:",
        logErr.message
      );
    }

    res.status(201).json(savedSupplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    try {
      await createLog({
        action: "Updated Supplier",
        module: "Supplier Management",
        description: `User ${req.user.username} updated a supplier: ${
          updated.name || "Unknown"
        }`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error(
        "[Activity Log] Failed to log supplier creation:",
        logErr.message
      );
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!deletedSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    try {
      await createLog({
        action: "Deleted Supplier",
        module: "Supplier Management",
        description: `User ${req.user.username} deleted a supplier: ${deletedSupplier.name}`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error(
        "[Activity Log] Failed to log supplier deletion:",
        logErr.message
      );
    }

    res.json({ message: "Supplier deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};