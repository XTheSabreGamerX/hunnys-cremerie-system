const Fuse = require("fuse.js");
const Acquisition = require("../models/Acquisition");
const InventoryItem = require("../models/InventoryItem");
const { createLog } = require("../controllers/activityLogController");
const { createNotification } = require("../controllers/notificationController");

// GET all acquisitions (with pagination + fuzzy search + sorting)
const getAllAcquisitions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const normalizedSearch = search.replace(/\s+/g, "");
    const field = req.query.field;
    const order = req.query.order === "desc" ? -1 : 1;
    const fetchAll = req.query.all === "true";

    const allAcquisitions = await Acquisition.find()
      .sort(field ? { [field]: order } : { createdAt: -1 })
      .populate("items.unit", "name")
      .populate("createdBy", "username");

    if (!search) {
      const totalItems = allAcquisitions.length;
      const totalPages = Math.ceil(totalItems / limit);
      const paginatedItems = fetchAll
        ? allAcquisitions
        : allAcquisitions.slice((page - 1) * limit, page * limit);

      return res.json({
        acquisitions: paginatedItems,
        currentPage: page,
        totalPages,
        totalItems,
      });
    }

    const normalizeFn = (val) => (val?.toString() || "").replace(/\s+/g, "");
    let fuseKeys = [];

    if (field) {
      fuseKeys = [{ name: field, getFn: (item) => normalizeFn(item[field]) }];
    } else {
      fuseKeys = [
        { name: "acquisitionId", getFn: (a) => normalizeFn(a.acquisitionId) },
        { name: "supplier", getFn: (a) => normalizeFn(a.supplier) },
        { name: "status", getFn: (a) => normalizeFn(a.status) },
        { name: "totalCost", getFn: (a) => normalizeFn(a.totalCost) },
        {
          name: "items.name",
          getFn: (a) => a.items.map((i) => normalizeFn(i.name)).join(" "),
        },
      ];
    }

    const fuse = new Fuse(allAcquisitions, {
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
      acquisitions: paginatedResults,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error("[GET ACQUISITIONS] Server error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching acquisitions" });
  }
};

// CREATE new acquisition (pending by default)
const createAcquisition = async (req, res) => {
  try {
    const { acquisitionId, items, subtotal, totalAmount, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "No items provided for acquisition" });
    }

    const firstSupplier = req.body.supplier || "Hunnys Crémerie";
   /*  const mixedSuppliers = items.some(
      (item) => item.supplier !== firstSupplier
    ); */

    /* if (mixedSuppliers) {
      return res.status(400).json({
        message:
          "All items in an acquisition must come from the same supplier.",
      });
    } */

    const createdBy = req.user?.id;

    const acquisition = new Acquisition({
      acquisitionId,
      supplier: firstSupplier,
      items,
      subtotal,
      totalAmount,
      paymentMethod,
      status: "Pending",
      createdBy,
    });

    await acquisition.save();

    try {
      await createLog({
        action: "Created Acquisition",
        module: "Product Acquisition",
        description: `User ${req.user.username} created acquisition ${acquisition.acquisitionId}.`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error("[LOGGING ERROR - CREATE ACQUISITION]:", logErr);
    }

    try {
      await createNotification({
        message: `New product acquisition request ${acquisition.acquisitionId} created by ${req.user.username}.`,
        type: "info",
        roles: ["admin", "owner"],
      });

      // Notify creator (confirmation)
      await createNotification({
        userId: req.user.id,
        message: `Your acquisition request ${acquisition.acquisitionId} has been submitted and is pending approval.`,
        type: "success",
        isGlobal: false,
      });
    } catch (notifErr) {
      console.error("[NOTIFICATION ERROR - CREATE ACQUISITION]:", notifErr);
    }

    res.status(201).json(acquisition);
  } catch (err) {
    console.error("[CREATE ACQUISITION] Error:", err);
    res.status(500).json({ message: "Error creating acquisition" });
  }
};

// CONFIRM acquisition (convert to inventory)
const confirmAcquisition = async (req, res) => {
  try {
    const { id } = req.params;

    const acquisition = await Acquisition.findById(id);
    if (!acquisition) {
      return res.status(404).json({ message: "Acquisition not found" });
    }

    if (acquisition.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Acquisition already confirmed or cancelled" });
    }

    for (const item of acquisition.items) {
      const existingItem = await InventoryItem.findOne({ name: item.name });

      if (existingItem) {
        existingItem.stock += item.quantity;
        await existingItem.save();
      } else {
        const newItem = new InventoryItem({
          name: item.name,
          itemId: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          stock: item.quantity,
          category: item.category || "Uncategorized",
          purchasePrice: item.unitCost,
          unit: item.unit,
          supplier: acquisition.supplier,
          createdBy: acquisition.createdBy,
        });
        await newItem.save();
      }
    }

    acquisition.status = "Received";
    await acquisition.save();

    try {
      await createLog({
        action: "Confirmed Acquisition",
        module: "Product Acquisition",
        description: `User ${req.user.username} confirmed acquisition ${acquisition.acquisitionId}.`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error("[LOGGING ERROR - CONFIRM ACQUISITION]:", logErr);
    }

    try {
      await createNotification({
        message: `Acquisition ${acquisition.acquisitionId} confirmed and inventory updated.`,
        type: "success",
        roles: ["admin", "owner"],
      });

      await createNotification({
        userId: acquisition.createdBy,
        message: `Your acquisition request ${acquisition.acquisitionId} has been marked as received.`,
        type: "success",
        isGlobal: false,
      });
    } catch (notifErr) {
      console.error("[NOTIFICATION ERROR - CONFIRM ACQUISITION]:", notifErr);
    }

    res.json({ message: "Acquisition confirmed and inventory updated" });
  } catch (err) {
    console.error("[CONFIRM ACQUISITION] Error:", err);
    res.status(500).json({ message: "Error confirming acquisition" });
  }
};

// CANCEL acquisition (mark as Cancelled)
const cancelAcquisition = async (req, res) => {
  try {
    const { id } = req.params;

    const acquisition = await Acquisition.findById(id);
    if (!acquisition) {
      return res.status(404).json({ message: "Acquisition not found" });
    }

    if (acquisition.status === "Received") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a completed acquisition" });
    }

    if (acquisition.status === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Acquisition is already cancelled" });
    }

    acquisition.status = "Cancelled";
    await acquisition.save();

    try {
      await createLog({
        action: "Cancelled Acquisition",
        module: "Product Acquisition",
        description: `User ${req.user.username} cancelled acquisition ${acquisition.acquisitionId}.`,
        userId: req.user.id,
      });
    } catch (logErr) {
      console.error("[LOGGING ERROR - CANCEL ACQUISITION]:", logErr);
    }

    try {
      await createNotification({
        message: `Acquisition ${acquisition.acquisitionId} has been cancelled.`,
        type: "warning",
        roles: ["admin", "owner"],
      });

      await createNotification({
        userId: acquisition.createdBy,
        message: `Your acquisition request ${acquisition.acquisitionId} has been cancelled.`,
        type: "warning",
        isGlobal: false,
      });
    } catch (notifErr) {
      console.error("[NOTIFICATION ERROR - CANCEL ACQUISITION]:", notifErr);
    }

    res.json({
      message: "Acquisition successfully cancelled",
      acquisition,
    });
  } catch (err) {
    console.error("[CANCEL ACQUISITION] Server error:", err);
    res
      .status(500)
      .json({ message: "Server error while cancelling acquisition" });
  }
};

module.exports = {
  getAllAcquisitions,
  createAcquisition,
  confirmAcquisition,
  cancelAcquisition,
};
