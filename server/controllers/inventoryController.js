const Fuse = require("fuse.js");
const InventoryItem = require("../models/InventoryItem");
const Category = require("../models/Category");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");
const ActionRequest = require("../models/ActionRequest");

// Computes inventory item status
function computeStatus(item) {
  const now = new Date();

  if (item.expirationDate && new Date(item.expirationDate) < now) {
    return "Expired";
  }

  if (item.stock <= 0) {
    return "Out of stock";
  }

  if (item.stock <= (item.restockThreshold ?? 5)) {
    return "Low-stock";
  }

  return "Well-stocked";
}

// GET all inventory items (with search + pagination + column filter + fuzzy search)
const getAllInventoryItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const field = req.query.field;
    const order = req.query.order === "desc" ? -1 : 1;
    const fetchAll = req.query.all === "true";

    // Fetch all items first
    const allItems = await InventoryItem.find()
      .sort(field ? { [field]: order } : { itemId: 1 })
      .populate("unit", "name amount")
      .populate("createdBy", "username");

    // If no search, just return paginated results
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

    // Determine Fuse.js keys based on column filter
    let fuseKeys = [];
    if (field) {
      // Column filter applied → only search that field
      if (
        ["purchasePrice", "unitPrice", "amount", "restockThreshold"].includes(
          field
        )
      ) {
        fuseKeys = [
          { name: field, getFn: (item) => item[field]?.toString() || "" },
        ];
      } else if (field === "unit.name") {
        fuseKeys = [
          { name: "unit.name", getFn: (item) => item.unit?.name || "" },
        ];
      } else {
        fuseKeys = [field];
      }
    } else {
      // No column filter → search all relevant fields
      fuseKeys = [
        "itemId",
        "name",
        "category",
        "supplier",
        "status",
        {
          name: "purchasePrice",
          getFn: (item) => item.purchasePrice?.toString() || "",
        },
        {
          name: "unitPrice",
          getFn: (item) => item.unitPrice?.toString() || "",
        },
        { name: "amount", getFn: (item) => item.amount?.toString() || "" },
        {
          name: "restockThreshold",
          getFn: (item) => item.restockThreshold?.toString() || "",
        },
        { name: "unit.name", getFn: (item) => item.unit?.name || "" },
      ];
    }

    // Fuse.js fuzzy search
    const fuse = new Fuse(allItems, {
      keys: fuseKeys,
      threshold: 0.4, // adjust for stricter/looser search
      ignoreLocation: true,
    });

    const fuseResults = fuse.search(search).map((result) => result.item);

    const totalItems = fuseResults.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedResults = fetchAll
      ? fuseResults
      : fuseResults.slice((page - 1) * limit, page * limit);

    res.json({
      items: paginatedResults,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error("[GET INVENTORY] Server error:", err);
    res.status(500).json({ message: "Server error while fetching inventory" });
  }
};

// Adding a new inventory item
const addInventoryItem = async (req, res) => {
  try {
    const categoryDoc = await Category.findById(req.body.category);
    if (!categoryDoc)
      return res.status(400).json({ message: "Invalid category" });

    const item = new InventoryItem({
      ...req.body,
      category: categoryDoc.name,
      createdBy: req.user.id,
    });

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
    console.error("Add item failed:", err);

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

    // Staff update request (if not creator of the item)
    if (
      req.user.role === "staff" &&
      item.createdBy.toString() !== req.user.id
    ) {
      await ActionRequest.create({
        module: "Inventory",
        moduleRef: "InventoryItem",
        targetId: item._id.toString(),
        requestType: "edit",
        details: {
          name: item.name,
          itemId: item.itemId,
          category: item.category,
          stock: item.stock,
          unitPrice: item.unitPrice,
          note: "Staff requested to edit this item",
        },
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

      return res.status(200).json({
        message: "Your update request has been sent for approval.",
      });
    }

    if (req.body.category) {
      const categoryDoc = await Category.findById(req.body.category);
      if (!categoryDoc) {
        return res.status(400).json({ message: "Invalid category" });
      }
      req.body.category = categoryDoc.name;
    }

    Object.assign(item, req.body);

    if (item.unitPrice < item.purchasePrice) {
      return res.status(400).json({
        message: "Unit Price must be greater than or equal to Purchase Price",
      });
    }

    await item.save();

    try {
      await createLog({
        action: "Updated Item",
        module: "Inventory",
        description: `User ${req.user.username} updated an item: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An inventory item "${item.name}" was updated.`,
        type: "info",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log update:", logErr.message);
    }

    res.json(item);
  } catch (err) {
    console.error("[UPDATE] Server error:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: err.message || "Failed to update item." });
  }
};

// Deleting an inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Staff delete request
    if (
      req.user.role === "staff" &&
      item.createdBy.toString() !== req.user.id
    ) {
      await ActionRequest.create({
        module: "Inventory",
        moduleRef: "InventoryItem",
        targetId: item._id.toString(),
        requestType: "delete",
        details: {
          name: item.name,
          itemId: item.itemId,
          category: item.category,
          stock: item.stock,
          unitPrice: item.unitPrice,
          note: "Staff requested deletion of this item",
        },
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Delete Item Request",
        module: "Inventory",
        description: `User ${req.user.username} requested to delete item: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `A delete request for inventory item: "${item.name}" is pending for approval.`,
        type: "warning",
        roles: ["admin", "owner", "manager"],
      });

      await createNotification({
        message: `Your delete request for "${item.name}" is pending approval.`,
        type: "info",
        userId: req.user.id,
        roles: [],
        isGlobal: false,
      });

      return res.status(200).json({
        message: "Your delete request has been sent for approval.",
      });
    }

    const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);

    try {
      await createLog({
        action: "Deleted Item",
        module: "Inventory",
        description: `User ${req.user.username} deleted an item: ${deletedItem.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An inventory item "${deletedItem.name}" was deleted.`,
        type: "success",
        roles: ["admin", "owner", "manager"],
      });
    } catch (logErr) {
      console.error("[Activity Log] Failed to log deletion:", logErr.message);
    }

    res.status(200).json({ message: "Item has been deleted successfully" });
  } catch (err) {
    console.error("[DELETE] Server error:", err.message);
    res.status(500).json({ message: "Server error during deletion" });
  }
};

// Periodic update for status
const batchUpdateStatuses = async () => {
  try {
    const items = await InventoryItem.find();

    const systemUserId = "6891c3c178b2ff675c9cdfd7";

    for (const item of items) {
      const newStatus = computeStatus(item);
      if (!item.createdBy) {
        item.createdBy = systemUserId;
      }

      if (item.status !== newStatus) {
        item.status = newStatus;
        await item.save();
      }
    }
    console.log("Batch status update complete");
  } catch (error) {
    console.error("Error during batch status update:", error);
  }
};

module.exports = {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  batchUpdateStatuses,
};
