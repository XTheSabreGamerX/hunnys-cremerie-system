const PurchaseOrder = require("../models/PurchaseOrder");
const InventoryItem = require("../models/InventoryItem");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");
const Fuse = require("fuse.js");

// Gets all purchase orders
const getAllPurchaseOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const normalizedSearch = search.replace(/\s+/g, "");
    const field = req.query.field;
    const order = req.query.order === "desc" ? -1 : 1;
    const fetchAll = req.query.all === "true";

    // Fetch all POs (non-cancelled maybe optional filter)
    const allPOs = await PurchaseOrder.find()
      .sort(field ? { [field]: order } : { poNumber: 1 })
      .populate("supplier", "name")
      .populate("items.item", "name itemId category")
      .populate("createdBy", "username");

    // No search => pagination only
    if (!search) {
      const totalItems = allPOs.length;
      const totalPages = Math.ceil(totalItems / limit);
      const paginatedItems = fetchAll
        ? allPOs
        : allPOs.slice((page - 1) * limit, page * limit);

      return res.json({
        items: paginatedItems,
        currentPage: page,
        totalPages,
        totalItems,
      });
    }

    // Fuse search setup
    const normalizeFn = (value) =>
      (value?.toString() || "").replace(/\s+/g, "");
    let fuseKeys = [];

    if (field) {
      if (["poNumber", "totalAmount"].includes(field)) {
        fuseKeys = [{ name: field, getFn: (po) => normalizeFn(po[field]) }];
      } else if (field === "supplier.name") {
        fuseKeys = [
          {
            name: "supplier.name",
            getFn: (po) => normalizeFn(po.supplier?.name),
          },
        ];
      } else {
        fuseKeys = [field];
      }
    } else {
      fuseKeys = [
        { name: "poNumber", getFn: (po) => normalizeFn(po.poNumber) },
        { name: "status", getFn: (po) => normalizeFn(po.status) },
        { name: "totalAmount", getFn: (po) => normalizeFn(po.totalAmount) },
        {
          name: "supplier.name",
          getFn: (po) => normalizeFn(po.supplier?.name),
        },
        {
          name: "items",
          getFn: (po) => po.items.map((i) => i.item?.name).join(" "),
        },
      ];
    }

    const fuse = new Fuse(allPOs, {
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
    console.error("[GET PURCHASE ORDERS] Server error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching purchase orders" });
  }
};

// Create Purchase Order
const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, items } = req.body;
    const createdBy = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    // Validate each item
    for (const item of items) {
      if (!item.item || !item.orderedQty || !item.purchasePrice) {
        return res.status(400).json({
          message: "Each item must have itemId, orderedQty, and purchasePrice",
        });
      }
    }

    // Generate PO number + increment each order number
    const lastPO = await PurchaseOrder.findOne().sort({ poNumber: -1 }).exec();
    const poNumber = lastPO ? lastPO.poNumber + 1 : 1;

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + item.orderedQty * item.purchasePrice,
      0
    );

    // Create PO document
    const newPO = new PurchaseOrder({
      poNumber,
      supplier: supplier || null,
      items,
      totalAmount,
      createdBy,
    });

    const savedPO = await newPO.save();

    // --- Activity Log: include all item names ---
    const poWithItems = await savedPO.populate("items.item", "name");
    
    const itemNames = poWithItems.items.map((i) => i.item.name).join(", ");

    await createLog({
      action: "Created PO",
      module: "Purchase Order",
      description: `Purchase Order created with items: ${itemNames}`,
      userId: req.user.id,
    });

    await createNotification({
      message: `Purchase Order created with items: ${itemNames}`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });

    return res
      .status(201)
      .json({ message: "Purchase Order created", purchaseOrder: savedPO });
  } catch (error) {
    console.error("Create PO Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Receive purchase order items
const receivePurchaseOrder = async (req, res) => {
  try {
    const { poId } = req.params;
    const { items } = req.body; // [{ itemId, receivedQty, expirationDate }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Received items are required" });
    }

    const po = await PurchaseOrder.findById(poId).populate("items.item");
    if (!po)
      return res.status(404).json({ message: "Purchase Order not found" });
    if (po.status === "Cancelled")
      return res.status(400).json({ message: "Cannot receive a cancelled PO" });

    const receivedSummary = []; // For logging/notification

    // Loop through each item in the PO
    for (const poItem of po.items) {
      const receivedData = items.find(
        (i) => i.itemId === poItem.item._id.toString()
      );

      if (!receivedData) continue; // no update for this item

      const receivedQty = Math.max(0, receivedData.receivedQty); // prevent negative
      if (receivedQty === 0) continue;

      // Update receivedQty (cannot exceed orderedQty)
      poItem.receivedQty = Math.min(
        poItem.orderedQty,
        poItem.receivedQty + receivedQty
      );

      // Update Inventory
      const inventoryItem = await InventoryItem.findById(poItem.item._id);
      inventoryItem.currentStock += receivedQty;

      // Add stockHistory entry
      inventoryItem.stockHistory.push({
        type: "Restock",
        quantity: receivedQty,
        previousStock: inventoryItem.currentStock - receivedQty,
        newStock: inventoryItem.currentStock,
        date: new Date(),
        note: `PO#${po.poNumber} received. Expiration: ${
          receivedData.expirationDate || "N/A"
        }`,
      });

      await inventoryItem.save();

      // Prepare summary for log/notification
      receivedSummary.push(
        `${inventoryItem.name}: ${receivedQty} unit(s)` +
          (receivedData.expirationDate
            ? ` (Exp: ${receivedData.expirationDate})`
            : "")
      );
    }

    // Update PO status
    const allReceived = po.items.every(
      (item) => item.receivedQty >= item.orderedQty
    );
    const anyReceived = po.items.some((item) => item.receivedQty > 0);

    po.status = allReceived
      ? "Completed"
      : anyReceived
      ? "Partially Delivered"
      : "Pending";

    const updatedPO = await po.save();

    // --- Activity Log & Notification ---
    if (receivedSummary.length > 0) {
      const summaryText = receivedSummary.join(", ");

      await createLog({
        action: "Received PO Items",
        module: "Purchase Order",
        description: `Received items for PO#${po.poNumber}: ${summaryText}`,
        userId: req.user.id,
      });

      await createNotification({
        message: `PO#${po.poNumber} received items: ${summaryText}`,
        type: "success",
        roles: ["owner", "manager"],
      });
    }

    res.json({
      message: "Purchase Order updated successfully",
      purchaseOrder: updatedPO,
    });
  } catch (err) {
    console.error("[RECEIVE PO] Server error:", err);
    res.status(500).json({
      message: "Server error while receiving PO items",
      error: err.message,
    });
  }
};

// Cancel Purchase Orders
const cancelPurchaseOrder = async (req, res) => {
  try {
    const { poId } = req.params;
    const { note } = req.body;

    const po = await PurchaseOrder.findById(poId);
    if (!po)
      return res.status(404).json({ message: "Purchase Order not found" });

    if (po.status === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Purchase Order is already cancelled" });
    }

    // Update status and note
    po.status = "Cancelled";
    po.note = note || po.note;

    const updatedPO = await po.save();

    // --- Activity Log & Notification ---
    const descriptionText = note
      ? `Cancelled PO#${po.poNumber}. Note: ${note}`
      : `Cancelled PO#${po.poNumber}.`;

    await createLog({
      action: "Cancelled PO",
      module: "Purchase Order",
      description: descriptionText,
      userId: req.user.id,
    });

    await createNotification({
      message: descriptionText,
      type: "alert",
      roles: ["owner", "manager"],
    });

    res.json({
      message: "Purchase Order has been cancelled",
      purchaseOrder: updatedPO,
    });
  } catch (err) {
    console.error("[CANCEL PO] Server error:", err);
    res.status(500).json({
      message: "Server error while cancelling PO",
      error: err.message,
    });
  }
};

module.exports = {
  getAllPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
};
