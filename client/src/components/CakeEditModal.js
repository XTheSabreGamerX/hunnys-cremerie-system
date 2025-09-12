import React, { useState } from "react";
import AsyncSelect from "react-select/async";
import "../styles/CakeEditModal.css";

const CakeEditModal = ({
  item,
  onSave,
  onClose,
  mode = "add",
  allItems = [],
  cakeSizes = [],
}) => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");
  const [selectedIngredientOption, setSelectedIngredientOption] =
    useState(null);
  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && item) {
      return {
        ...item,
        size: item.size?._id || item.size || "",
        ingredients: (item.ingredients || []).map((ing) => ({
          inventoryItem: ing.inventoryItem?._id || ing.inventoryItem,
          name: ing.inventoryItem?.name || ing.name || "",
          quantity: ing.quantity,
        })),
      };
    }
    return {
      name: "",
      category: "",
      size: "",
      stock: 0,
      unitPrice: 0,
      amount: 1,
      expirationDate: "",
      layers: 1,
      price: 0,
      availability: "Always",
      seasonalPeriod: { startDate: "", endDate: "" },
      ingredients: [],
    };
  });

  const [ingredientForm, setIngredientForm] = useState({
    itemId: "",
    quantity: 1,
  });

  const loadIngredientOptions = async (inputValue, callback) => {
    if (!inputValue || inputValue.length < 1) {
      callback([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/inventory?search=${encodeURIComponent(
          inputValue
        )}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        callback([]);
        return;
      }
      const data = await res.json();
      const itemsArray = Array.isArray(data)
        ? data
        : data.items || data.results || [];
      const options = itemsArray.map((it) => ({
        value: it._id,
        label: `${it.name} (Stock: ${it.stock})`,
        stock: it.stock,
        meta: it,
      }));
      callback(options);
    } catch (err) {
      console.error("Ingredient search error", err);
      callback([]);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSeasonalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      seasonalPeriod: { ...prev.seasonalPeriod, [field]: value },
    }));
  };

  const handleAddIngredient = () => {
    const selected = allItems.find((i) => i._id === ingredientForm.itemId);
    if (!selected) return;

    const newIngredient = {
      inventoryItem: selected._id,
      name: selected.name,
      quantity: ingredientForm.quantity,
    };

    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient],
    }));

    setIngredientForm({ itemId: "", quantity: 1 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="cake-modal-overlay">
      <div className="cake-modal-content">
        <h2>{mode === "add" ? "Add New Cake" : "Edit Cake"}</h2>
        <form onSubmit={handleSubmit} className="cake-form-grid">
          {/* LEFT COLUMN */}
          <div className="cake-form-left">
            {/* Form Inputs group */}
            <div className="cake-form-group">
              <label>Cake Name</label>
              <input
                type="text"
                className="cake-input"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Chocolate Fudge"
                required
              />
            </div>

            <div className="cake-form-group">
              <label>Category</label>
              <input
                type="text"
                className="cake-input"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="e.g. Birthday, Wedding"
              />
            </div>

            <div className="cake-form-group">
              <label>Size</label>
              <select
                className="cake-input"
                value={formData.size}
                onChange={(e) => handleChange("size", e.target.value)}
                required
              >
                <option value="">-- Select Size --</option>
                {cakeSizes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="cake-form-group">
              <label>Stock</label>
              <input
                type="number"
                className="cake-input"
                value={formData.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
              />
            </div>

            <div className="cake-form-group">
              <label>Unit Price</label>
              <input
                type="number"
                className="cake-input"
                value={formData.unitPrice}
                onChange={(e) => handleChange("unitPrice", e.target.value)}
                required
              />
            </div>

            <div className="cake-form-group">
              <label>Amount</label>
              <input
                type="number"
                className="cake-input"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
              />
            </div>

            <div className="cake-form-group">
              <label>Layers</label>
              <input
                type="number"
                className="cake-input"
                value={formData.layers}
                onChange={(e) => handleChange("layers", e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="cake-form-group">
              <label>Price</label>
              <input
                type="number"
                className="cake-input"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>

            <div className="cake-form-group">
              <label>Expiration Date</label>
              <input
                type="date"
                className="cake-input"
                value={formData.expirationDate}
                onChange={(e) => handleChange("expirationDate", e.target.value)}
              />
            </div>

            <div className="cake-form-group">
              <label>Availability</label>
              <select
                className="cake-input"
                value={formData.availability}
                onChange={(e) => handleChange("availability", e.target.value)}
              >
                <option value="Always">Always</option>
                <option value="Seasonal">Seasonal</option>
              </select>
            </div>

            {formData.availability === "Seasonal" && (
              <div className="cake-form-group">
                <label>Seasonal Period</label>
                <div className="cake-seasonal-period">
                  <input
                    type="date"
                    className="cake-input"
                    value={formData.seasonalPeriod.startDate || ""}
                    onChange={(e) =>
                      handleSeasonalChange("startDate", e.target.value)
                    }
                  />
                  <input
                    type="date"
                    className="cake-input"
                    value={formData.seasonalPeriod.endDate || ""}
                    onChange={(e) =>
                      handleSeasonalChange("endDate", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {/* Ingredient picker */}
            <div className="cake-form-group">
              <label>Add Ingredient</label>

              <AsyncSelect
                cacheOptions
                loadOptions={loadIngredientOptions}
                defaultOptions={false}
                value={selectedIngredientOption}
                onChange={(opt) => setSelectedIngredientOption(opt)}
                placeholder="Search ingredient..."
                isClearable
                classNamePrefix="cake-ingredient-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  menuList: (base) => ({
                    ...base,
                    maxHeight: 150,
                    overflowY: "auto",
                  }),
                }}
              />

              <div className="cake-ingredient-controls">
                <input
                  type="number"
                  className="cake-input"
                  value={ingredientForm.quantity}
                  min="1"
                  onChange={(e) =>
                    setIngredientForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                />

                <button
                  type="button"
                  className="cake-btn add-ingredient-btn"
                  onClick={handleAddIngredient}
                >
                  + Add Ingredient
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="cake-form-right">
            <h3>Ingredients</h3>
            <div className="cake-ingredient-list">
              {formData.ingredients.length === 0 && (
                <p>No ingredients added yet.</p>
              )}
              {formData.ingredients.map((ing, idx) => (
                <div key={idx} className="cake-ingredient-row">
                  <span>{ing.name}</span>
                  <span>{ing.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Buttons */}
        <div className="cake-modal-buttons">
          <button
            type="submit"
            className="cake-btn save-btn"
            onClick={handleSubmit}
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cake-btn cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CakeEditModal;
