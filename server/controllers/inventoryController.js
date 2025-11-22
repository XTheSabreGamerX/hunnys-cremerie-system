const Fuse = require("fuse.js");
const InventoryItem = require("../models/InventoryItem");
const Repack = require("../models/Repack");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const Notification = require("../models/Notification");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");
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

//Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
    // Destructure incoming body
    const {
      itemId,
      name,
      currentStock = 0,
      threshold = 0,
      markup = 0,
      sellingPrice: frontEndPrice,
      category,
      unit,
      suppliers: incomingSuppliers = [],
      expirationDate,
      isSplit = false,
    } = req.body;

    // -------------------- SUPPLIERS --------------------
    let finalSuppliers = [];
    if (incomingSuppliers.length > 0) {
      for (const s of incomingSuppliers) {
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

      // Ensure exactly one preferred supplier
      if (!finalSuppliers.some((s) => s.isPreferred)) {
        finalSuppliers[0].isPreferred = true;
      }
    }

    // -------------------- PRICING --------------------
    let lastManualPrice = frontEndPrice != null ? parseFloat(frontEndPrice) : 0;
    let sellingPrice = 0;

    const preferredSupplier = finalSuppliers.find((s) => s.isPreferred);
    if (preferredSupplier) {
      sellingPrice = preferredSupplier.purchasePrice * (1 + markup / 100);
    } else {
      sellingPrice = lastManualPrice * (1 + markup / 100);
    }

    // -------------------- CREATE ITEM --------------------
    const newItem = await InventoryItem.create({
      itemId,
      name,
      currentStock,
      threshold,
      markup,
      sellingPrice,
      lastManualPrice,
      category,
      unit,
      suppliers: finalSuppliers,
      expirationDate,
      isSplit,
      createdBy: req.user.id,
      stockHistory: [
        {
          type: "Created",
          quantity: currentStock,
          previousStock: 0,
          newStock: currentStock,
          note: "Initial item creation.",
        },
      ],
    });

    res.json(newItem);
  } catch (err) {
    console.error("[ADD INVENTORY] Server error:", err);
    res.status(500).json({ message: err.message || "Failed to add item." });
  }
};

// ---------------------------- UPDATE INVENTORY ----------------------------
const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // -------------------- STAFF REQUEST --------------------
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

    const {
      name,
      currentStock,
      threshold,
      markup,
      sellingPrice: frontEndPrice,
      category,
      unit,
      suppliers: incomingSuppliers = [],
      expirationDate,
      isSplit,
    } = req.body;

    // -------------------- SUPPLIERS --------------------
    let finalSuppliers = item.suppliers;
    if (incomingSuppliers.length > 0) {
      finalSuppliers = [];
      for (const s of incomingSuppliers) {
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

      if (!finalSuppliers.some((s) => s.isPreferred))
        finalSuppliers[0].isPreferred = true;
    }

    // -------------------- PRICING --------------------
    let lastManualPrice =
      frontEndPrice != null ? parseFloat(frontEndPrice) : item.lastManualPrice;
    let sellingPrice = 0;

    const preferredSupplier = finalSuppliers.find((s) => s.isPreferred);
    const effectiveMarkup = markup != null ? markup : item.markup ?? 0;

    if (preferredSupplier) {
      sellingPrice =
        preferredSupplier.purchasePrice * (1 + effectiveMarkup / 100);
    } else {
      sellingPrice = lastManualPrice * (1 + effectiveMarkup / 100);
    }

    // -------------------- APPLY UPDATES --------------------
    const previousStock = item.currentStock;

    Object.assign(item, {
      name: name ?? item.name,
      currentStock: currentStock ?? item.currentStock,
      threshold: threshold ?? item.threshold,
      markup: markup ?? item.markup,
      lastManualPrice,
      sellingPrice,
      category: category ?? item.category,
      unit: unit ?? item.unit,
      suppliers: finalSuppliers,
      expirationDate: expirationDate ?? item.expirationDate,
      isSplit: isSplit ?? item.isSplit,
      updatedBy: req.user.id,
    });

    // -------------------- STOCK HISTORY --------------------
    const changes = [];
    if (previousStock !== item.currentStock)
      changes.push(
        `Stock changed from ${previousStock} to ${item.currentStock}`
      );
    if (frontEndPrice != null)
      changes.push(`Selling price updated to ${item.sellingPrice}`);
    if (threshold != null && threshold !== item.threshold)
      changes.push(`Threshold updated to ${item.threshold}`);

    if (changes.length > 0) {
      item.stockHistory.push({
        type: "Adjustment",
        quantity: Math.abs(item.currentStock - previousStock),
        previousStock,
        newStock: item.currentStock,
        note: `${req.user.username} updated inventory: ${changes.join("; ")}`,
      });
    }

    // -------------------- STATUS & SAVE --------------------
    item.status = calculateStatus(
      item.currentStock,
      item.threshold,
      item.expirationDate
    );
    await item.save();

    res.json(item);
  } catch (err) {
    console.error("[UPDATE INVENTORY] Server error:", err);
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
      lastManualPrice: parentItem.lastManualPrice,
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

      item.$locals = item.$locals || {};
      item.$locals.skipLog = true;

      await item.save();
    }

    console.log("Batch status update complete");
  } catch (err) {
    console.error("[BATCH STATUS] Error:", err);
  }
};

// ---------------------------- DAILY INVENTORY UPDATE ----------------------------
const generateInventoryTable = ({
  criticalItems,
  lowStockItems,
  outOfStockItems,
}) => {
  let html = `<h2>Daily Inventory Summary</h2>`;
  const sections = [
    { title: "Critical", items: criticalItems },
    { title: "Low Stock", items: lowStockItems },
    { title: "Out of Stock", items: outOfStockItems },
  ];

  for (const sec of sections) {
    if (sec.items.length > 0) {
      html += `<h3>${sec.title} (${sec.items.length})</h3>`;
      html += `<table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Item ID</th>
          <th>Name</th>
          <th>Current Stock</th>
          <th>Threshold</th>
          <th>Status</th>
        </tr>`;
      for (const item of sec.items) {
        html += `<tr>
          <td>${item.itemId}</td>
          <td>${item.name}</td>
          <td>${item.currentStock}</td>
          <td>${item.threshold}</td>
          <td>${item.status}</td>
        </tr>`;
      }
      html += `</table><br/>`;
    }
  }

  return html;
};

const sendDailyInventoryNotifications = async () => {
  try {
    const today = new Date().toDateString();

    // Prevent multiple notifications per day
    const existing = await Notification.findOne({
      type: "InventoryDailySummary",
    }).sort({ createdAt: -1 });
    if (existing && new Date(existing.createdAt).toDateString() === today) {
      console.log("Daily inventory notification already sent today.");
      return;
    }

    const items = await InventoryItem.find({});
    console.log(
      "All items:",
      items.map((i) => i.status)
    );

    // Fetch items by status
    const criticalItems = await InventoryItem.find({
      status: "Critical",
      archived: false,
    });
    const lowStockItems = await InventoryItem.find({
      status: "Low-stock",
      archived: false,
    });
    const outOfStockItems = await InventoryItem.find({
      status: "Out of stock",
      archived: false,
    });

    if (
      criticalItems.length === 0 &&
      lowStockItems.length === 0 &&
      outOfStockItems.length === 0
    ) {
      console.log("No inventory issues today.");
      return;
    }

    // Create summary message
    let message = "Daily Inventory Summary:\n";
    if (criticalItems.length > 0)
      message += `• Critical: ${criticalItems.length}\n`;
    if (lowStockItems.length > 0)
      message += `• Low Stock: ${lowStockItems.length}\n`;
    if (outOfStockItems.length > 0)
      message += `• Out of Stock: ${outOfStockItems.length}\n`;

    // Save notification in DB
    await createNotification({
      message: message,
      type: "warning",
      isGlobal: true,
    });

    // Generate HTML table for email
    const htmlTable = generateInventoryTable({
      criticalItems,
      lowStockItems,
      outOfStockItems,
    });

    // Send email to all admins/managers/owners
    const recipients = await User.find({
      role: { $in: ["admin", "owner", "manager"] },
      email: { $exists: true, $ne: "" },
    });
    const adminEmails = recipients.map((u) => u.email);

    if (adminEmails.length > 0) {
      await transporter.sendMail({
        from: `"Hunny's Cremerie" <${process.env.EMAIL_USER}>`,
        to: adminEmails.join(","),
        subject: "Daily Inventory Summary",
        html: htmlTable,
      });
    }

    console.log("Daily inventory notification & email sent.");
  } catch (err) {
    console.error("[DAILY NOTIFICATION] Error:", err);
  }
};

module.exports = {
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  repackInventoryItem,
  batchUpdateStatuses,
  sendDailyInventoryNotifications,
};
