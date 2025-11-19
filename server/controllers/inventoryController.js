const Fuse = require("fuse.js");
const InventoryItem = require("../models/InventoryItem");
const Repack = require("../models/Repack");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const { createNotification } = require("./notificationController");
const { createLog } = require("./activityLogController");
const ActionRequest = require("../models/ActionRequest");

// Helper: compute selling price based on preferred supplier and markup
const computeSellingPrice = (suppliers, markup) => {
  const preferred = suppliers.find((s) => s.isPreferred);
  if (!preferred) return 0;
  return preferred.purchasePrice * (1 + markup / 100);
};

// Helper: calculate status based on currentStock, threshold, expirationDate
const calculateStatus = (currentStock, threshold, expirationDate) => {
  const now = new Date();
  if (expirationDate && expirationDate < now) return "Expired";
  if (currentStock <= 0) return "Out of stock";
  if (currentStock <= threshold / 4) return "Critical";
  if (currentStock <= threshold / 3) return "Low-stock";
  return "Well-stocked";
};

// ---------------------------- GET INVENTORY ----------------------------
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

    const normalizeFn = (value) =>
      (value?.toString() || "").replace(/\s+/g, "");
    let fuseKeys = [];

    if (field) {
      if (["sellingPrice", "currentStock", "threshold"].includes(field)) {
        fuseKeys = [{ name: field, getFn: (item) => normalizeFn(item[field]) }];
      } else if (field === "unit.name") {
        fuseKeys = [
          { name: "unit.name", getFn: (item) => normalizeFn(item.unit?.name) },
        ];
      } else if (field === "suppliers") {
        fuseKeys = [
          {
            name: "suppliers",
            getFn: (item) =>
              item.suppliers.map((s) => s.supplier?.name).join(" "),
          },
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
        {
          name: "sellingPrice",
          getFn: (item) => normalizeFn(item.sellingPrice),
        },
        {
          name: "currentStock",
          getFn: (item) => normalizeFn(item.currentStock),
        },
        { name: "threshold", getFn: (item) => normalizeFn(item.threshold) },
        { name: "unit.name", getFn: (item) => normalizeFn(item.unit?.name) },
        {
          name: "suppliers",
          getFn: (item) =>
            item.suppliers.map((s) => s.supplier?.name).join(" "),
        },
      ];
    }

    const fuse = new Fuse(allItems, {
      keys: fuseKeys,
      threshold: 0.4,
      ignoreLocation: true,
    });
    const fuseResults = fuse.search(normalizedSearch).map((r) => r.item);

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

// ---------------------------- ADD INVENTORY ----------------------------
const addInventoryItem = async (req, res) => {
  try {
    // Category
    if (req.body.category) {
      const categoryDoc = await Category.findById(req.body.category);
      if (!categoryDoc)
        return res.status(400).json({ message: "Invalid category" });
      req.body.category = categoryDoc.name;
    }

    // Suppliers
    const suppliersInput = req.body.suppliers || [];
    const validSuppliers = [];
    for (const s of suppliersInput) {
      const supplierDoc = await Supplier.findById(s.supplier);
      if (!supplierDoc)
        return res
          .status(400)
          .json({ message: `Supplier not found: ${s.supplier}` });
      validSuppliers.push({
        supplier: supplierDoc._id,
        purchasePrice: s.purchasePrice,
        isPreferred: !!s.isPreferred,
      });
    }

    // Ensure one preferred supplier
    if (
      !validSuppliers.some((s) => s.isPreferred) &&
      validSuppliers.length > 0
    ) {
      validSuppliers[0].isPreferred = true;
    }

    // Selling Price Calculation
    let sellingPrice;
    if (validSuppliers.length > 0) {
      sellingPrice = computeSellingPrice(validSuppliers, req.body.markup || 0);
    } else if (req.body.sellingPrice != null) {
      // apply markup to manual input
      const markup = Number(req.body.markup || 0);
      sellingPrice =
        Math.round(req.body.sellingPrice * (1 + markup / 100) * 100) / 100;
    } else {
      sellingPrice = 0;
    }

    const { currentStock = 0 } = req.body;

    const item = new InventoryItem({
      ...req.body,
      suppliers: validSuppliers,
      sellingPrice,
      status: calculateStatus(
        currentStock,
        req.body.threshold || 0,
        req.body.expirationDate
      ),
      stockHistory:
        currentStock > 0
          ? [
              {
                type: "Created",
                quantity: currentStock,
                previousStock: 0,
                newStock: currentStock,
                date: new Date(),
                note: "Initial item creation.",
              },
            ]
          : [],
      createdBy: req.user.id,
    });

    await item.save();

    // Add item to supplier records
    for (const s of item.suppliers) {
      await Supplier.findByIdAndUpdate(s.supplier, {
        $addToSet: {
          itemsSupplied: {
            inventoryItem: item._id,
            purchasePrice: s.purchasePrice,
          },
        },
      });
    }

    await createLog({
      action: "Added Item",
      module: "Inventory",
      description: `Inventory item "${item.name}" was added.`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Inventory item "${item.name}" was created.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

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

// ---------------------------- UPDATE INVENTORY ----------------------------
const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Staff request logic
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
          ...item.toObject(),
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
        message: `An update request for inventory item: "${item.name}" is pending approval.`,
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

      return res
        .status(200)
        .json({ message: "Your update request has been sent for approval." });
    }

    // Category
    if (req.body.category) {
      const categoryDoc = await Category.findById(req.body.category);
      if (!categoryDoc)
        return res.status(400).json({ message: "Invalid category" });
      req.body.category = categoryDoc.name;
    }

    // Suppliers
    let finalSuppliers = item.suppliers; // default to existing suppliers
    if (req.body.suppliers) {
      const suppliersInput = req.body.suppliers;
      finalSuppliers = [];
      for (const s of suppliersInput) {
        const supplierDoc = await Supplier.findById(s.supplier);
        if (!supplierDoc)
          return res
            .status(400)
            .json({ message: `Supplier not found: ${s.supplier}` });
        finalSuppliers.push({
          supplier: supplierDoc._id,
          purchasePrice: s.purchasePrice,
          isPreferred: !!s.isPreferred,
        });
      }
      // Ensure at least one preferred supplier
      if (
        !finalSuppliers.some((s) => s.isPreferred) &&
        finalSuppliers.length > 0
      ) {
        finalSuppliers[0].isPreferred = true;
      }
      req.body.suppliers = finalSuppliers;
    }

    // Selling price calculation
    if (req.body.sellingPrice != null) {
      // If user manually set sellingPrice, optionally apply markup
      const markupPercent = req.body.markup ?? item.markup ?? 0;
      req.body.sellingPrice = Math.max(
        0,
        parseFloat(req.body.sellingPrice) * (1 + markupPercent / 100)
      );
    } else if (finalSuppliers.length > 0) {
      // Compute selling price from suppliers + markup
      req.body.sellingPrice = computeSellingPrice(
        finalSuppliers,
        req.body.markup ?? item.markup ?? 0
      );
    } else {
      // fallback
      req.body.sellingPrice = item.sellingPrice ?? 0;
    }

    const previousStock = item.currentStock;

    // Apply incoming updates
    Object.assign(item, req.body);

    // Stock history / adjustment log
    if (
      previousStock !== item.currentStock ||
      req.body.sellingPrice !== undefined ||
      req.body.threshold !== undefined ||
      req.body.unit !== undefined ||
      req.body.expirationDate !== undefined
    ) {
      const changes = [];

      if (previousStock !== item.currentStock) {
        changes.push(
          `Stock changed from ${previousStock} to ${item.currentStock}`
        );
      }

      if (
        req.body.sellingPrice !== undefined &&
        req.body.sellingPrice !== item.sellingPrice
      ) {
        changes.push(`Selling price updated to ${item.sellingPrice}`);
      }

      if (
        req.body.threshold !== undefined &&
        req.body.threshold !== item.threshold
      ) {
        changes.push(`Threshold updated to ${item.threshold}`);
      }

      const noteText = req.body.note
        ? `${req.user.username}: ${req.body.note}${
            changes.length > 0 ? " | " + changes.join("; ") : ""
          }`
        : `${req.user.username} updated inventory${
            changes.length > 0 ? ": " + changes.join("; ") : ""
          }`;

      item.stockHistory.push({
        type: "Adjustment",
        quantity: Math.abs(item.currentStock - previousStock),
        previousStock,
        newStock: item.currentStock,
        date: new Date(),
        note: noteText,
      });
    }

    // Update status
    item.status = calculateStatus(
      item.currentStock,
      item.threshold,
      item.expirationDate
    );

    item.updatedBy = req.user.id;
    await item.save();

    // Sync suppliers (add/remove)
    const oldSupplierIds = item.suppliers.map((s) => s.supplier.toString());
    const newSupplierIds = (req.body.suppliers || []).map((s) =>
      s.supplier.toString()
    );

    // Remove old
    for (const supId of oldSupplierIds) {
      if (!newSupplierIds.includes(supId)) {
        await Supplier.findByIdAndUpdate(supId, {
          $pull: { itemsSupplied: { inventoryItem: item._id } },
        });
      }
    }

    // Add new
    for (const s of req.body.suppliers || []) {
      if (!oldSupplierIds.includes(s.supplier.toString())) {
        await Supplier.findByIdAndUpdate(s.supplier, {
          $addToSet: {
            itemsSupplied: {
              inventoryItem: item._id,
              purchasePrice: s.purchasePrice,
            },
          },
        });
      }
    }

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

// ---------------------------- DELETE / ARCHIVE INVENTORY ----------------------------
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Staff approval logic
    if (
      req.user.role === "staff" &&
      item.createdBy.toString() !== req.user.id
    ) {
      await ActionRequest.create({
        module: "Inventory",
        moduleRef: "InventoryItem",
        targetId: item._id.toString(),
        requestType: "archive",
        details: {
          ...item.toObject(),
          note: req.body.note || "Staff requested archiving",
        },
        requestedBy: req.user.id,
      });

      await createLog({
        action: "Archive Item Request",
        module: "Inventory",
        description: `User ${req.user.username} requested to archive item: ${item.name}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `An archive request for inventory item: "${item.name}" is pending approval.`,
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

      return res
        .status(200)
        .json({ message: "Your archive request has been sent for approval." });
    }

    // ---------------------------------------
    // Archive the item
    // ---------------------------------------
    item.archived = true;

    // Add stock history entry
    item.stockHistory.push({
      type: "Adjustment",
      quantity: 0,
      previousStock: item.currentStock,
      newStock: item.currentStock,
      date: new Date(),
      note: `${req.user.username} archived the item${
        req.body.note ? `: ${req.body.note}` : ""
      }`,
    });

    await item.save();

    await createLog({
      action: "Archived Item",
      module: "Inventory",
      description: `User ${req.user.username} archived item: ${item.name}`,
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

// ---------------------------- REPACK INVENTORY ----------------------------
const repackInventoryItem = async (req, res) => {
  try {
    const { parentItemId, stockToUse, childName, unit, itemId, childStock } =
      req.body;

    if (
      !parentItemId ||
      !stockToUse ||
      !childName ||
      !unit ||
      !itemId ||
      !childStock
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parentItem = await InventoryItem.findById(parentItemId);
    if (!parentItem || parentItem.archived)
      return res
        .status(404)
        .json({ message: "Parent item not found or archived" });

    if (stockToUse > parentItem.currentStock) {
      return res
        .status(400)
        .json({ message: "Insufficient stock in parent item" });
    }

    // Deduct from parent
    const previousStock = parentItem.currentStock;
    parentItem.currentStock -= stockToUse;
    parentItem.status = calculateStatus(
      parentItem.currentStock,
      parentItem.threshold,
      parentItem.expirationDate
    );
    parentItem.stockHistory.push({
      type: "Adjustment",
      quantity: -stockToUse,
      previousStock,
      newStock: parentItem.currentStock,
      note: `Used for repacking into "${childName}"`,
    });
    await parentItem.save();

    // Create child item
    const childItem = new InventoryItem({
      itemId,
      name: childName,
      category: parentItem.category,
      currentStock: childStock,
      threshold: parentItem.threshold,
      unit,
      suppliers: parentItem.suppliers,
      markup: parentItem.markup,
      sellingPrice: parentItem.sellingPrice,
      createdBy: req.user.id,
      status: calculateStatus(
        childStock,
        parentItem.threshold,
        parentItem.expirationDate
      ),
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

    res.status(201).json({ parentItem, childItem, repackRecord });
  } catch (err) {
    console.error("[REPACK INVENTORY] Error:", err);
    res.status(500).json({ message: "Server error while repacking item" });
  }
};

// ---------------------------- BATCH STATUS UPDATE ----------------------------
const batchUpdateStatuses = async () => {
  try {
    const items = await InventoryItem.find({ archived: false });
    const systemUserId = "6891c3c178b2ff675c9cdfd7";

    for (const item of items) {
      item.status = calculateStatus(
        item.currentStock,
        item.threshold,
        item.expirationDate
      );
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
