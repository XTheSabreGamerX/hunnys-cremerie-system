const Supplier = require("../models/Supplier");
const Fuse = require('fuse.js');
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

// GET /api/suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/suppliers/paginated
const getPaginatedSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const normalizedSearch = search.replace(/\s+/g, '');
    const field = req.query.field;
    const order = req.query.order === "desc" ? -1 : 1;
    const fetchAll = req.query.all === "true";

    const allSuppliers = await Supplier.find().sort(field ? { [field]: order } : { supplierId: 1 });

    if (!search) {
      const totalItems = allSuppliers.length;
      const totalPages = Math.ceil(totalItems / limit);
      const paginatedItems = fetchAll ? allSuppliers : allSuppliers.slice((page - 1) * limit, page * limit);

      return res.json({
        suppliers: paginatedItems,
        currentPage: page,
        totalPages,
        totalItems,
      });
    }

    const normalizeFn = (value) => (value?.toString() || "").replace(/\s+/g, '');
    let fuseKeys = [];

    if (field) {
      fuseKeys = [{ name: field, getFn: (item) => normalizeFn(item[field]) }];
    } else {
      fuseKeys = [
        { name: "supplierId", getFn: (item) => normalizeFn(item.supplierId) },
        { name: "name", getFn: (item) => normalizeFn(item.name) },
        { name: "contact", getFn: (item) => normalizeFn(item.contact) },
        { name: "company", getFn: (item) => normalizeFn(item.company) },
      ];
    }

    const fuse = new Fuse(allSuppliers, {
      keys: fuseKeys,
      threshold: 0.4,
      ignoreLocation: true,
    });

    const fuseResults = fuse.search(normalizedSearch).map(result => result.item);

    const totalItems = fuseResults.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedResults = fetchAll ? fuseResults : fuseResults.slice((page - 1) * limit, page * limit);

    res.json({
      suppliers: paginatedResults,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error("[GET SUPPLIERS] Server error:", err);
    res.status(500).json({ message: "Server error while fetching suppliers" });
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

      await createNotification({
        message: `A supplier: "${savedSupplier.name}" was created.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
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

      await createNotification({
        message: `A supplier: "${updated.name}" was edited.`,
        type: "info",
        roles: ["admin", "owner", "manager"],
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

      await createNotification({
        message: `A supplier: "${deletedSupplier.name}" was deleted.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
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
  getPaginatedSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
