const mongoose = require("mongoose");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");

const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, unique: true, required: true },
    name: { type: String, required: true },

    // Stock fields
    currentStock: { type: Number, min: 0, default: 0 },
    threshold: { type: Number, min: 0, default: 0 }, // low-stock warning

    markup: { type: Number, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    lastManualPrice: { type: Number, default: 0},

    category: { type: String },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "UnitOfMeasurement" },

    suppliers: [
      {
        supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
        purchasePrice: { type: Number, min: 0 },
        isPreferred: { type: Boolean, default: false },
      },
    ],

    expirationDate: { type: Date },
    isSplit: { type: Boolean, default: false },

    status: {
      type: String,
      enum: [
        "Well-stocked",
        "Low-stock",
        "Critical",
        "Out of stock",
        "Expired",
      ],
      default: "Well-stocked",
    },
    archived: {
      type: Boolean,
      default: false,
    },

    repackedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Repack" }],

    stockHistory: [
      {
        type: {
          type: String,
          enum: ["Restock", "Sale", "Adjustment", "Refund", "Created"],
          required: true,
        },
        quantity: { type: Number, required: true },
        previousStock: { type: Number, required: true },
        newStock: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Status calculation function
function calculateStatus(currentStock, threshold, expirationDate) {
  const now = new Date();
  if (expirationDate && expirationDate < now) return "Expired";
  if (currentStock <= 0) return "Out of stock";
  if (currentStock <= threshold / 4) return "Critical";
  if (currentStock <= threshold / 3) return "Low-stock";
  return "Well-stocked";
}

// Pre-save hook
inventoryItemSchema.pre("save", function (next) {
  this.status = calculateStatus(
    this.currentStock,
    this.threshold,
    this.expirationDate
  );
  next();
});

// Pre-update hook
inventoryItemSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() || {};
    const currentDoc = await this.model.findOne(this.getQuery());

    const initialStock =
      update.currentStock ??
      (update.$set ? update.$set.currentStock : currentDoc.currentStock);
    const maxStock =
      update.threshold ??
      (update.$set ? update.$set.threshold : currentDoc.threshold);
    const expirationDate =
      update.expirationDate ??
      (update.$set ? update.$set.expirationDate : currentDoc.expirationDate);

    update.status = calculateStatus(currentStock, threshold, expirationDate);
    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
});

// Post-save hook for logging and notifications
inventoryItemSchema.post("save", async function (doc, next) {
  try {
    if (this.$locals?.skipLog) return next();

    await createLog({
      action: "Updated Item",
      module: "Inventory",
      description: `Inventory item "${doc.name}" was updated.`,
      userId: doc.updatedBy || doc.createdBy,
    });

    await createNotification({
      message: `Inventory item "${doc.name}" was updated.`,
      type: "info",
      roles: ["admin", "owner", "manager"],
    });
  } catch (err) {
    console.error(
      "[Inventory Hook] Failed to create log/notification:",
      err.message
    );
  }
  next();
});

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
