function calculateStatus(currentStock, threshold, expirationDate) {
  const now = new Date();
  if (expirationDate && expirationDate < now) return "Expired";
  if (currentStock <= 0) return "Out of stock";
  if (currentStock <= threshold / 4) return "Critical";
  if (currentStock <= threshold / 3) return "Low-stock";
  return "Well-stocked";
}

module.exports = { calculateStatus };
