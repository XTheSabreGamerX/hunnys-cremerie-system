const Fuse = require("fuse.js");
const InventoryItem = require("../models/InventoryItem");
const Repack = require("../models/Repack");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");
const ActionRequest = require("../models/ActionRequest");

// GET all inventory items (with search + pagination + fuzzy search)
const getAllInventoryItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const normalizedSearch = search.replace(/\s+/g, "");
    const field = req.query.field;
    const order = req.query.order === "desc" ? -1 : 1;
    const fetchAll = req.query.all === "true";

    const allItems = await InventoryItem.find({ archived: false })
      .sort(field ? { [field]: order } : { itemId: 1 })
      .populate("unit", "name amount")
      .populate("suppliers.supplier", "name")
      .populate("createdBy", "username");

    if (!search) {
      const totalItems = allItems.length;
      const totalPages = Math.ceil(totalItems / limit);
      const paginatedItems = fetchAll
        ? allItems
        : allItems.slice((page - 1) * limit, page * limit);

      return res.json({
        items: paginatedItems,
        currentPage: page,
        totalPages,
        totalItems,
      });
    }

    const normalizeFn = (value) => (value?.toString() || "").replace(/\s+/g, "");
    let fuseKeys = [];

    if (field) {
      if (["sellingPrice", "initialStock", "maxStock"].includes(field)) {
        fuseKeys = [{ name: field, getFn: (item) => normalizeFn(item[field]) }];
      } else if (field === "unit.name") {
        fuseKeys = [{ name: "unit.name", getFn: (item) => normalizeFn(item.unit?.name) }];
      } else if (field === "suppliers") {
        fuseKeys = [
          { name: "suppliers", getFn: (item) => item.suppliers.map((s) => s.supplier?.name).join(" ") },
        ];
      } else {
        fuseKeys = [field];
      }
    } else {
      fuseKeys = [
        { name: "itemId", getFn: (item) => normalizeFn(item.itemId) },
        { name: "name", getFn: (item) => normalizeFn(item.name) },
        { name: "category", getFn: (item) => normalizeFn(item.category) },
        { name: "status", getFn: (item) => normalizeFn(item.status) },
        { name: "sellingPrice", getFn: (item) => normalizeFn(item.sellingPrice) },
        { name: "initialStock", getFn: (item) => normalizeFn(item.initialStock) },
        { name: "maxStock", getFn: (item) => normalizeFn(item.maxStock) },
        { name: "unit.name", getFn: (item) => normalizeFn(item.unit?.name) },
        { name: "suppliers", getFn: (item) => item.suppliers.map((s) => s.supplier?.name).join(" ") },
      ];
    }

    const fuse = new Fuse(allItems, { keys: fuseKeys, threshold: 0.4, ignoreLocation: true });
    const fuseResults = fuse.search(normalizedSearch).map((r) => r.item);

    const totalItems = fuseResults.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedResults = fetchAll
      ? fuseResults
      : fuseResults.slice((page - 1) * limit, page * limit);

    res.json({ items: paginatedResults, currentPage: page, totalPages, totalItems });
  } catch (err) {
    console.error("[GET INVENTORY] Server error:", err);
    res.status(500).json({ message: "Server error while fetching inventory" });
  }
};

// Adding a new inventory item
const addInventoryItem = async (req, res) => {
  try {
    if (req.body.category) {
      const categoryDoc = await Category.findById(req.body.category);
      if (!categoryDoc) return res.status(400).json({ message: "Invalid category" });
      req.body.category = categoryDoc.name;
    }

    const suppliersInput = req.body.suppliers || [];
    const validSuppliers = [];
    for (const s of suppliersInput) {
      const supplierDoc = await Supplier.findById(s.supplier);
      if (!supplierDoc) return res.status(400).json({ message: `Supplier not found: ${s.supplier}` });
      validSuppliers.push({ supplier: supplierDoc._id, purchasePrice: s.purchasePrice });
    }

    const item = new InventoryItem({ ...req.body, suppliers: validSuppliers, createdBy: req.user.id });
    await item.save();

    try {
      await createLog({
        action: "Added Item",
        module: "Inventory",
        description: `An inventory item was added: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An inventory item "${item.name}" was created.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log addition:", logErr.message);
    }

    res.status(201).json(item);
  } catch (err) {
    console.error("[ADD INVENTORY] Error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: err.message || "Failed to add item." });
  }
};

// Updating an inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (req.user.role === "staff" && item.createdBy.toString() !== req.user.id) {
      await ActionRequest.create({
        module: "Inventory",
        moduleRef: "InventoryItem",
        targetId: item._id.toString(),
        requestType: "edit",
        details: { ...item.toObject(), note: "Staff requested to edit this item" },
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Update Item Request",
        module: "Inventory",
        description: `User ${req.user.username} requested to update item: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An update request for inventory item: "${item.name}" is pending for approval.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });

      await createNotification({
        message: `Your update request for "${item.name}" is pending approval.`,
        type: "info",
        userId: req.user.id,
        roles: [],
        isGlobal: false,
      });

      return res.status(200).json({ message: "Your update request has been sent for approval." });
    }

    if (req.body.category) {
      const categoryDoc = await Category.findById(req.body.category);
      if (!categoryDoc) return res.status(400).json({ message: "Invalid category" });
      req.body.category = categoryDoc.name;
    }

    if (req.body.suppliers) {
      const suppliersInput = req.body.suppliers;
      const validSuppliers = [];
      for (const s of suppliersInput) {
        const supplierDoc = await Supplier.findById(s.supplier);
        if (!supplierDoc) return res.status(400).json({ message: `Supplier not found: ${s.supplier}` });
        validSuppliers.push({ supplier: supplierDoc._id, purchasePrice: s.purchasePrice });
      }
      req.body.suppliers = validSuppliers;
    }

    req.body.updatedBy = req.user.id;
    Object.assign(item, req.body);
    await item.save();

    /* try {
      await createLog({
        action: "Updated Item",
        module: "Inventory",
        description: `Inventory item "${item.name}" was updated.`,
        userId: req.user.id,
      });

      await createNotification({
        message: `Inventory item "${item.name}" was updated.`,
        type: "info",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log update:", logErr.message);
    } */

    res.json(item);
  } catch (err) {
    console.error("[UPDATE INVENTORY] Server error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: err.message || "Failed to update item." });
  }
};

// Soft-delete / archive inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (req.user.role === "staff" && item.createdBy.toString() !== req.user.id) {
      await ActionRequest.create({
        module: "Inventory",
        moduleRef: "InventoryItem",
        targetId: item._id.toString(),
        requestType: "archive",
        details: { ...item.toObject(), note: "Staff requested archiving" },
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Archive Item Request",
        module: "Inventory",
        description: `User ${req.user.username} requested to archive item: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An archive request for inventory item: "${item.name}" is pending for approval.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });

      await createNotification({
        message: `Your archive request for "${item.name}" is pending approval.`,
        type: "info",
        userId: req.user.id,
        roles: [],
        isGlobal: false,
      });

      return res.status(200).json({ message: "Your archive request has been sent for approval." });
    }

    item.archived = true;
    await item.save();

    await createLog({
      action: "Archived Item",
      module: "Inventory",
      description: `User ${req.user.username} archived an item: ${item.name}`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Inventory item "${item.name}" was archived.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    res.status(200).json({ message: "Item has been archived successfully" });
  } catch (err) {
    console.error("[DELETE INVENTORY] Error:", err);
    res.status(500).json({ message: "Server error during archiving" });
  }
};

// Repack inventory item
const repackInventoryItem = async (req, res) => {
  try {
    const { parentItemId, stockToUse, childName, unit, itemId, childStock } = req.body;

    if (!parentItemId || !stockToUse || !childName || !unit || !itemId || !childStock) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parentItem = await InventoryItem.findById(parentItemId);
    if (!parentItem || parentItem.archived) return res.status(404).json({ message: "Parent item not found or archived" });

    if (stockToUse > parentItem.initialStock) {
      return res.status(400).json({ message: "Insufficient stock in parent item" });
    }

    parentItem.initialStock -= stockToUse;
    await parentItem.save();

    const childItem = new InventoryItem({
      itemId,
      name: childName,
      category: parentItem.category,
      initialStock: childStock,
      maxStock: childStock,
      unit,
      suppliers: parentItem.suppliers,
      createdBy: req.user.id,
      sellingPrice: parentItem.sellingPrice,
    });

    await childItem.save();

    const repackRecord = new Repack({
      itemId,
      parentItem: parentItem._id,
      childItem: childItem._id,
      parentStockUsed: stockToUse,
      childStockCreated: childStock,
      createdBy: req.user.id,
    });

    await repackRecord.save();

    parentItem.repackedItems.push(repackRecord._id);
    await parentItem.save();

    try {
      await createLog({
        action: "Repacked Item",
        module: "Inventory",
        description: `User ${req.user.username} repacked "${parentItem.name}" into "${childItem.name}"`,
        userId: req.user.id,
      });

      await createNotification({
        message: `Repacked "${parentItem.name}" into "${childItem.name}" successfully.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log repack:", logErr.message);
    }

    res.status(201).json({ parentItem, childItem, repackRecord });
  } catch (err) {
    console.error("[REPACK INVENTORY] Error:", err);
    res.status(500).json({ message: "Server error while repacking item" });
  }
};

// Batch update statuses
const batchUpdateStatuses = async () => {
  try {
    const items = await InventoryItem.find({ archived: false });
    const systemUserId = "6891c3c178b2ff675c9cdfd7";

    for (const item of items) {
      item.updatedBy = item.updatedBy || systemUserId;
      await item.save();
    }

    console.log("Batch status update complete");
  } catch (err) {
    console.error("[BATCH STATUS] Error:", err);
  }
};

module.exports = {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  repackInventoryItem,
  batchUpdateStatuses,
};