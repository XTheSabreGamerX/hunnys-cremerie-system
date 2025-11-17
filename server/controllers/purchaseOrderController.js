const PurchaseOrder = require("../models/PurchaseOrder");
const InventoryItem = require("../models/InventoryItem");
const Supplier = require("../models/Supplier");
const crypto = require("crypto");

// Create PO with validation
const createPurchaseOrder = async (req, res) => {
  try {
    const { supplierId, items, note, createdBy } = req.body;

    if (!supplierId || !items || !items.length) {
      return res
        .status(400)
        .json({ message: "Supplier and items are required" });
    }

    // Validate supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });

    // Validate each item and get default purchase price
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const inventoryItem = await InventoryItem.findById(item.inventoryItem);
        if (!inventoryItem)
          throw new Error(`Item ${item.inventoryItem} not found`);

        // Check that the supplier actually supplies this item
        const supplierData = inventoryItem.suppliers.find(
          (s) => s.supplier.toString() === supplierId
        );
        if (!supplierData)
          throw new Error(
            `Supplier does not supply item ${inventoryItem.name}`
          );

        return {
          inventoryItem: inventoryItem._id,
          quantity: item.quantity,
          proposedPrice: supplierData.purchasePrice, // default from InventoryItem
          supplierPrice: item.supplierPrice ?? supplierData.purchasePrice, // user can override
        };
      })
    );

    // Create PO
    const po = new PurchaseOrder({
      supplier: supplierId,
      items: validatedItems,
      note,
      createdBy,
      status: "Pending",
    });

    await po.save();

    res.status(201).json({ message: "Purchase Order created", po });
  } catch (error) {
    console.error(error);
    if (
      error.message.includes("not found") ||
      error.message.includes("does not supply")
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Get PO by ID
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const po = await PurchaseOrder.findById(id)
      .populate("supplier")
      .populate("items.inventoryItem")
      .populate("createdBy");

    if (!po) return res.status(404).json({ message: "PO not found" });

    res.json(po);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Generate temporary supplier link
const generateSupplierLink = async (req, res) => {
  try {
    const { id } = req.params;

    const po = await PurchaseOrder.findById(id);
    if (!po) return res.status(404).json({ message: "PO not found" });

    const token = crypto.randomBytes(16).toString("hex");
    po.temporaryLinkToken = token;
    po.temporaryLinkExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await po.save();

    const link = `${process.env.SITE_URL}/purchase-orders/review/${token}`;
    res.json({ message: "Temporary link generated", link });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Supplier review
const supplierReview = async (req, res) => {
  try {
    const { token } = req.params;
    const { items, supplierNote } = req.body;

    const po = await PurchaseOrder.findOne({
      temporaryLinkToken: token,
      temporaryLinkExpires: { $gt: Date.now() },
    });

    if (!po)
      return res.status(404).json({ message: "Invalid or expired link" });

    // Update items
    po.items.forEach((item) => {
      const updated = items.find(
        (i) => i.inventoryItem == item.inventoryItem.toString()
      );
      if (updated) {
        item.supplierPrice = updated.supplierPrice ?? item.supplierPrice;
        item.isAvailable = updated.isAvailable ?? item.isAvailable;
      }
    });

    po.supplierNote = supplierNote;
    po.status = "Awaiting Approval";
    await po.save();

    res.json({ message: "Supplier review submitted", po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 5. Approve/Reject PO
const approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const po = await PurchaseOrder.findById(id);
    if (!po) return res.status(404).json({ message: "PO not found" });

    if (action === "approve") {
      po.status = "Approved";
    } else if (action === "reject") {
      po.status = "Rejected";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await po.save();
    res.json({ message: `PO ${action}d`, po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 6. Receive Stock
const receiveStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems } = req.body; // [{ inventoryItem, quantityReceived }]

    const po = await PurchaseOrder.findById(id);
    if (!po) return res.status(404).json({ message: "PO not found" });

    receivedItems.forEach((r) => {
      const poItem = po.items.find(
        (i) => i.inventoryItem.toString() === r.inventoryItem
      );
      if (poItem) {
        // Record received items
        po.receivedItems.push({
          inventoryItem: r.inventoryItem,
          quantityReceived: r.quantityReceived,
        });

        // Reduce remaining quantity
        poItem.quantity -= r.quantityReceived;
      }
    });

    // Determine status
    const anyRemaining = po.items.some((i) => i.quantity > 0);
    po.status = anyRemaining ? "Partial" : "Completed";

    await po.save();
    res.json({ message: "Stock received", po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrderById,
  generateSupplierLink,
  supplierReview,
  approvePurchaseOrder,
  receiveStock,
};
