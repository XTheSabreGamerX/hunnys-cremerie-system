const Cake = require("../models/Cake");
const CakeSize = require("../models/CakeSize");
const InventoryItem = require("../models/InventoryItem");
const { createNotification } = require("./notificationController");
const { createLog } = require("./activityLogController");
const ActionRequest = require("../models/ActionRequest");

// CAKE SIZE CONTROLLERS

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

    if (!name) return res.status(400).json({ message: "Size name is required" });

    const existing = await CakeSize.findOne({ name });
    if (existing) return res.status(409).json({ message: "Cake Size already exists" });

    const size = new CakeSize({ name, description });
    await size.save();

    await createLog({
      action: "Added Cake Size",
      module: "Cake",
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
      module: "Cake",
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
      module: "Cake",
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

// CAKE CONTROLLERS

// Get all cakes (with search, pagination)
const getAllCakes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    let searchFilter = {};

    if (search) {
      searchFilter = { name: { $regex: search, $options: "i" } };
    }

    const total = await Cake.countDocuments(searchFilter);
    const totalPages = Math.ceil(total / limit);

    const cakes = await Cake.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .populate("size", "name description")
      .populate("ingredients.inventoryItem", "name unitPrice stock");

    res.json({ cakes, totalPages, currentPage: page, totalItems: total });
  } catch (err) {
    console.error("Error fetching cakes:", err.message);
    res.status(500).json({ message: "Server error fetching cakes" });
  }
};

// Add a new cake
const addCake = async (req, res) => {
  try {
    const cake = new Cake({
      ...req.body,
      createdBy: req.user.id,
    });

    await cake.save();

    await createLog({
      action: "Added Cake",
      module: "Cake",
      description: `Cake "${cake.name}" was created.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `A new cake "${cake.name}" was added.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.status(201).json(cake);
  } catch (err) {
    console.error("Add Cake failed:", err.message);
    res.status(500).json({ message: err.message || "Server error adding cake" });
  }
};

// Update cake
const updateCake = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ message: "Cake not found" });

    // Staff edit request if not creator
    if (req.user.role === "staff" && cake.createdBy.toString() !== req.user.id) {
      await ActionRequest.create({
        module: "Cake",
        moduleRef: "Cake",
        targetId: cake._id.toString(),
        requestType: "edit",
        details: req.body,
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Cake Update Request",
        module: "Cake",
        description: `User ${req.user.username} requested to edit cake: ${cake.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An update request for cake "${cake.name}" is pending approval.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });

      return res.status(200).json({ message: "Update request sent for approval" });
    }

    Object.assign(cake, req.body);
    await cake.save();

    await createLog({
      action: "Updated Cake",
      module: "Cake",
      description: `Cake "${cake.name}" was updated.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Cake "${cake.name}" was updated.`,
      type: "info",
      roles: ["admin", "owner", "manager"],
    });

    res.json(cake);
  } catch (err) {
    console.error("Update Cake failed:", err.message);
    res.status(500).json({ message: err.message || "Server error updating cake" });
  }
};

// Delete cake
const deleteCake = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ message: "Cake not found" });

    if (req.user.role === "staff" && cake.createdBy.toString() !== req.user.id) {
      await ActionRequest.create({
        module: "Cake",
        moduleRef: "Cake",
        targetId: cake._id.toString(),
        requestType: "delete",
        details: { name: cake.name },
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Cake Delete Request",
        module: "Cake",
        description: `User ${req.user.username} requested to delete cake: ${cake.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `A delete request for cake "${cake.name}" is pending approval.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });

      return res.status(200).json({ message: "Delete request sent for approval" });
    }

    await Cake.findByIdAndDelete(req.params.id);

    await createLog({
      action: "Deleted Cake",
      module: "Cake",
      description: `Cake "${cake.name}" was deleted.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Cake "${cake.name}" was deleted.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.json({ message: "Cake deleted successfully" });
  } catch (err) {
    console.error("Delete Cake failed:", err.message);
    res.status(500).json({ message: "Server error deleting cake" });
  }
};

// Process Cake Sale
const processCakeSale = async (req, res) => {
  try {
    const { excludedIngredients = [] } = req.body;
    const cake = await Cake.findById(req.params.id).populate("ingredients.inventoryItem");

    if (!cake) return res.status(404).json({ message: "Cake not found" });

    const result = await cake.processSale(excludedIngredients);

    await createLog({
      action: "Cake Sold",
      module: "Cake",
      description: `Cake "${cake.name}" sold.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Cake "${cake.name}" was sold.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.json(result);
  } catch (err) {
    console.error("Process Cake Sale failed:", err.message);
    res.status(500).json({ message: err.message || "Error processing cake sale" });
  }
};

module.exports = {
  getAllCakeSizes,
  addCakeSize,
  updateCakeSize,
  deleteCakeSize,
  getAllCakes,
  addCake,
  updateCake,
  deleteCake,
  processCakeSale,
};