const mongoose = require("mongoose");
const InventoryItem = mongoose.model("InventoryItem");

const cakeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    size: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CakeSize",
      required: true,
    },
    ingredients: [
      {
        inventoryItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
    baseCost: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    availability: {
      type: String,
      enum: ["Always", "Seasonal"],
      default: "Always",
    },
    seasonalPeriod: { startDate: { type: Date }, endDate: { type: Date } },
    status: {
      type: String,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate baseCost
cakeSchema.pre("save", async function (next) {
  if (!this.ingredients || this.ingredients.length === 0) return next();

  let totalCost = 0;
  for (const ing of this.ingredients) {
    const item = await InventoryItem.findById(ing.inventoryItem);
    if (item) totalCost += item.unitPrice * ing.quantity;
  }

  this.baseCost = totalCost;

  // If no price was provided, fallback to baseCost
  if (this.price == null || this.price === 0) {
    this.price = this.baseCost;
  }
  next();
});

// Method for Sale process
cakeSchema.methods.processSale = async function (excludedIngredients = []) {
  let saleBaseCost = 0;

  for (const ing of this.ingredients) {
    if (excludedIngredients.includes(ing.inventoryItem.toString())) continue;

    const item = await InventoryItem.findById(ing.inventoryItem);
    if (!item) throw new Error(`InventoryItem not found: ${ing.inventoryItem}`);
    if (item.stock < 1) throw new Error(`Not enough stock for ${item.name}`);

    // Deduct stock (whole item)
    item.stock -= 1;
    await item.save();

    // Add to baseCost
    saleBaseCost += item.unitPrice * ing.quantity;
  }

  return {
    baseCost: saleBaseCost,
    finalPrice: this.price,
  };
};

module.exports = mongoose.model("Cake", cakeSchema);
