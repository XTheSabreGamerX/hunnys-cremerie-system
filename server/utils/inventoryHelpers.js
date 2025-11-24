const { createNotification } = require('../controllers/notificationController');
const { calculateStatus } = require('../utils/statusUtils');
const InventoryItem = require('../models/InventoryItem');

const criticalStatuses = ["Low-stock", "Critical", "Out of stock"];

async function updateItemStatus(item) {
  const oldStatus = item.status;
  item.status = calculateStatus(item.currentStock, item.threshold, item.expirationDate);

  if (item.status !== oldStatus && criticalStatuses.includes(item.status)) {
    await createNotification({
      message: `Inventory item "${item.name}" is now ${item.status}.`,
      type: "warning",
      roles: ["admin", "owner", "manager"],
      isGlobal: true,
      eventType: "low_stock",
    });
  }

  await item.save();
  return item;
}

module.exports = { updateItemStatus };
