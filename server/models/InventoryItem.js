const mongoose = require("mongoose");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");

const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: String, unique: true },
  name: { type: String, required: true },
  stock: { type: Number, min: 0, default: 0 },
  category: { type: String },
  purchasePrice: { type: Number, min: 0, default: 0 },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (value) {
        if (this.purchasePrice === undefined) return true;
        return value >= this.purchasePrice;
      },
      message: "Unit Price must be greater than or equal to Purchase Price",
    },
  },
  amount: { type: Number, required: true, min: 1 },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UnitOfMeasurement",
  },
  supplier: { type: String },
  restockThreshold: { type: Number, default: 0 },
  expirationDate: { type: Date },
  status: {
    type: String,
    enum: ["Well-stocked", "Low-stock", "Out of stock", "Expired"],
    default: "Well-stocked",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  //isSplit boolean default false optional (tag for repacking)
});

// Calculates Status After Creation/Update
function calculateStatus(stock, threshold, expirationDate) {
  const now = new Date();
  if (expirationDate && expirationDate < now) return "Expired";
  if (stock <= 0) return "Out of stock";
  if (stock <= threshold) return "Low-stock";
  return "Well-stocked";
}

// Pre-save hook
inventoryItemSchema.pre("save", function (next) {
  this.status = calculateStatus(
    this.stock,
    this.restockThreshold,
    this.expirationDate
  );
  next();
});

// Pre-update hook
inventoryItemSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};

  if (
    update.stock !== undefined ||
    update.restockThreshold !== undefined ||
    update.expirationDate !== undefined
  ) {
    const stock = update.stock ?? (update.$set ? update.$set.stock : undefined);
    const restockThreshold =
      update.restockThreshold ??
      (update.$set ? update.$set.restockThreshold : undefined);
    const expirationDate =
      update.expirationDate ??
      (update.$set ? update.$set.expirationDate : undefined);

    update.status = calculateStatus(stock, restockThreshold, expirationDate);
    this.setUpdate(update);
  }
  next();
});

inventoryItemSchema.post("save", async function (doc, next) {
  try {
    if (this.$locals?.skipLog) return next();

    // Create log
    await createLog({
      action: "Updated Item",
      module: "Inventory",
      description: `Inventory item "${doc.name}" was updated.`,
      userId: doc.updatedBy || doc.createdBy,
    });

    // Create notification
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
