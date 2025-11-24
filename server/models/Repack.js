const mongoose = require("mongoose");
const { createNotification } = require("../controllers/notificationController");
const { createLog } = require("../controllers/activityLogController");

const repackSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true },
    parentItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    childItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    parentStockUsed: { type: Number, required: true, min: 1 }, // How many parent units consumed
    childStockCreated: { type: Number, required: true, min: 1 }, // How many new stock created
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Status calculation based on stock count
function calculateStatus(stockCount) {
  if (stockCount <= 0) return "Out of stock";
  if (stockCount <= 5) return "Critical";
  if (stockCount <= 10) return "Low-stock";
  return "Well-stocked";
}

// Pre-save hook to calculate status
repackSchema.pre("save", function (next) {
  this.status = calculateStatus(this.stockCount);
  next();
});

// Post-save hook for logging and notifications
repackSchema.post("save", async function (doc, next) {
  try {
    if (this.$locals?.skipLog) return next();

    await createLog({
      action: "Created Repack",
      module: "Inventory Repack",
      description: `Repack item "${doc.name}" created from parent item: ${doc.parentItem}`,
      userId: doc.createdBy,
    });

    await createNotification({
      message: `A new repack item "${doc.name}" was created.`,
      type: "success",
      roles: ["admin", "owner", "manager"],
    });
  } catch (err) {
    console.error("[Repack Hook] Failed to log/notify:", err.message);
  }
  next();
});

module.exports = mongoose.model("RepackItem", repackSchema);
