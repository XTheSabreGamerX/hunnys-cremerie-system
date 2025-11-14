const mongoose = require("mongoose");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");

const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, unique: true, required: true },
    name: { type: String, required: true },

    // Stock fields
    initialStock: { type: Number, min: 0, default: 0 },
    maxStock: { type: Number, min: 1, default: 1 },

    sellingPrice: { type: Number, required: true, min: 0 },

    category: { type: String },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "UnitOfMeasurement" },

    suppliers: [
      {
        supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
        purchasePrice: { type: Number, min: 0 },
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Status calculation function
function calculateStatus(initialStock, maxStock, expirationDate) {
  const now = new Date();
  if (expirationDate && expirationDate < now) return "Expired";
  if (initialStock <= 0) return "Out of stock";
  if (initialStock <= maxStock * 0.1) return "Critical";
  if (initialStock <= maxStock * 0.2) return "Low-stock";
  return "Well-stocked";
}

// Pre-save hook
inventoryItemSchema.pre("save", function (next) {
  this.status = calculateStatus(
    this.initialStock,
    this.maxStock,
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
      update.initialStock ??
      (update.$set ? update.$set.initialStock : currentDoc.initialStock);
    const maxStock =
      update.maxStock ??
      (update.$set ? update.$set.maxStock : currentDoc.maxStock);
    const expirationDate =
      update.expirationDate ??
      (update.$set ? update.$set.expirationDate : currentDoc.expirationDate);

    update.status = calculateStatus(initialStock, maxStock, expirationDate);
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
