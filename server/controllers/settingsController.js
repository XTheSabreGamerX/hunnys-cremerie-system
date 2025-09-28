const Category = require("../models/Category");
const CakeSize = require("../models/CakeSize");
const UnitOfMeasurement = require("../models/UnitOfMeasurement");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

// Units of Measurement Controllers

// Get all Units of Measurement
const getAllUoms = async (req, res) => {
  try {
    const uoms = await UnitOfMeasurement.find().sort({ name: 1 });
    res.json(uoms);
  } catch (err) {
    console.error("Error fetching UoMs:", err.message);
    res.status(500).json({ message: "Server error fetching UoMs" });
  }
};

// Create new Unit of Measurement
const createUom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Unit name is required" });
    }

    const existing = await UnitOfMeasurement.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "Unit already exists" });
    }

    const uom = new UnitOfMeasurement({
      name,
    });

    await uom.save();

    await createLog({
      action: "Deleted Unit of Measurement",
      module: "Settings",
      description: `Unit of Measurement "${uom.name}" was created.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Unit of Measurement "${uom.name}" was created.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.status(201).json(uom);
  } catch (err) {
    console.error("Error creating UoM:", err.message);
    res.status(500).json({ message: "Server error creating UoM" });
  }
};

// Update Unit of Measurement
const updateUom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const uom = await UnitOfMeasurement.findById(id);
    if (!uom) {
      return res.status(404).json({ message: "Unit not found" });
    }

    if (name && name !== uom.name) {
      const exists = await UnitOfMeasurement.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ message: "Another unit with this name already exists" });
      }
      uom.name = name;
    }

    await uom.save();

    await createLog({
      action: "Deleted Unit of Measurement",
      module: "Settings",
      description: `Unit of Measurement "${uom.name}" was updated.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Unit of Measurement "${uom.name}" was updated.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.json(uom);
  } catch (err) {
    console.error("Error updating UoM:", err.message);
    res.status(500).json({ message: "Server error updating UoM" });
  }
};

// Delete Unit of Measurement
const deleteUom = async (req, res) => {
  try {
    const { id } = req.params;

    const uom = await UnitOfMeasurement.findById(id);
    if (!uom) {
      return res.status(404).json({ message: "Unit not found" });
    }

    await UnitOfMeasurement.findByIdAndDelete(id);

    await createLog({
      action: "Deleted Unit of Measurement",
      module: "Settings",
      description: `Unit of Measurement "${uom.name}" was deleted.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Unit of Measurement "${uom.name}" was deleted.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.json({ message: "Unit of Measurement deleted successfully" });
  } catch (err) {
    console.error("Error deleting UoM:", err.message);
    res.status(500).json({ message: "Server error deleting UoM" });
  }
};

// Cake Size Controllers

// Get all Cake Sizes
const getAllCakeSizes = async (req, res) => {
  try {
    const sizes = await CakeSize.find().sort({ name: 1 });
    res.json(sizes);
  } catch (err) {
    console.error("Error fetching Cake Sizes:", err.message);
    res.status(500).json({ message: "Server error fetching Cake Sizes" });
  }
};

// Add new Cake Size
const addCakeSize = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name)
      return res.status(400).json({ message: "Size name is required" });

    const existing = await CakeSize.findOne({ name });
    if (existing)
      return res.status(409).json({ message: "Cake Size already exists" });

    const size = new CakeSize({ name, description });
    await size.save();

    await createLog({
      action: "Added Cake Size",
      module: "Settings",
      description: `A cake size "${name}" was created.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `A new Cake Size "${name}" was added.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.status(201).json(size);
  } catch (err) {
    console.error("Add Cake Size failed:", err.message);
    res.status(500).json({ message: "Server error adding Cake Size" });
  }
};

// Update Cake Size
const updateCakeSize = async (req, res) => {
  try {
    const size = await CakeSize.findById(req.params.id);
    if (!size) return res.status(404).json({ message: "Cake Size not found" });

    Object.assign(size, req.body);
    await size.save();

    await createLog({
      action: "Updated Cake Size",
      module: "Settings",
      description: `Cake Size "${size.name}" updated.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Cake Size "${size.name}" was updated.`,
      type: "info",
      roles: ["admin", "owner", "manager"],
    });

    res.json(size);
  } catch (err) {
    console.error("Update Cake Size failed:", err.message);
    res.status(500).json({ message: "Server error updating Cake Size" });
  }
};

// Delete Cake Size
const deleteCakeSize = async (req, res) => {
  try {
    const size = await CakeSize.findById(req.params.id);
    if (!size) return res.status(404).json({ message: "Cake Size not found" });

    await CakeSize.findByIdAndDelete(req.params.id);

    await createLog({
      action: "Deleted Cake Size",
      module: "Settings",
      description: `Cake Size "${size.name}" deleted.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Cake Size "${size.name}" was deleted.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.json({ message: "Cake Size deleted successfully" });
  } catch (err) {
    console.error("Delete Cake Size failed:", err.message);
    res.status(500).json({ message: "Server error deleting Cake Size" });
  }
};

// Get all Categories
const getAllCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const categories = await Category.find(filter).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};
// Create new Category
const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Category name and type are required" });
    }

    const existing = await Category.findOne({ name, type });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const category = new Category({ name, type });
    await category.save();

    await createLog({
      action: "Added Category",
      module: "Settings",
      description: `Category "${name}" was created.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `A new Category "${name}" was added.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating Category:", err.message);
    res.status(500).json({ message: "Server error creating Category" });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name && name !== category.name) {
      const exists = await Category.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ message: "Another category with this name already exists" });
      }
      category.name = name;
    }

    await category.save();

    await createLog({
      action: "Updated Category",
      module: "Settings",
      description: `Category "${category.name}" updated.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Category "${category.name}" was updated.`,
      type: "info",
      roles: ["admin", "owner", "manager"],
    });

    res.json(category);
  } catch (err) {
    console.error("Error updating Category:", err.message);
    res.status(500).json({ message: "Server error updating Category" });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await Category.findByIdAndDelete(id);

    await createLog({
      action: "Deleted Category",
      module: "Settings",
      description: `Category "${category.name}" was deleted.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Category "${category.name}" was deleted.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting Category:", err.message);
    res.status(500).json({ message: "Server error deleting Category" });
  }
};

module.exports = {
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
};
