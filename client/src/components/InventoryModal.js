import React, { useState, useEffect } from "react";
import { customAlphabet } from "nanoid/non-secure";
import { FaPlus, FaTrash } from "react-icons/fa";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import "../styles/InventoryModal.css";

const InventoryModal = ({
  isOpen,
  onClose,
  categories,
  uoms,
  suppliers,
  onItemAdded,
}) => {
  const [formData, setFormData] = useState({
    itemId: "",
    name: "",
    initialStock: 0,
    maxStock: 1,
    sellingPrice: 0,
    category: "",
    unit: "",
    expirationDate: "",
    suppliers: [],
  });

  const [tempSupplier, setTempSupplier] = useState({
    supplier: "",
    purchasePrice: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nanoid = customAlphabet("0123456789", 6);

  const generateItemCode = (name, categoryName) => {
    const namePart = (name?.substring(0, 3) || "XXX").toUpperCase();
    const categoryPart = (categoryName?.substring(0, 3) || "XXX").toUpperCase();
    const randomPart = nanoid();
    return `${namePart}-${categoryPart}-${randomPart}`;
  };

  const calculateStatus = (initialStock, maxStock, expirationDate) => {
    const now = new Date();
    const expDate = expirationDate ? new Date(expirationDate) : null;

    if (expDate && expDate < now) return "Expired";
    if (initialStock <= 0) return "Out of stock";
    if (initialStock <= maxStock * 0.1) return "Critical";
    if (initialStock <= maxStock * 0.2) return "Low-stock";
    return "Well-stocked";
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.category &&
      formData.unit &&
      formData.initialStock >= 0 &&
      formData.maxStock > 0 &&
      formData.sellingPrice >= 0
    );
  };

  useEffect(() => {
    const categoryName =
      categories.find((c) => c._id === formData.category)?.name || "";
    if (formData.name && categoryName) {
      setFormData((prev) => ({
        ...prev,
        itemId: generateItemCode(prev.name, categoryName),
      }));
    }
  }, [formData.name, formData.category, categories]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        itemId: "",
        name: "",
        initialStock: 0,
        maxStock: 1,
        sellingPrice: 0,
        category: "",
        unit: "",
        expirationDate: "",
        suppliers: [],
      });
      setTempSupplier({ supplier: "", purchasePrice: 0 });
      setError("");
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["initialStock", "maxStock", "sellingPrice"].includes(name)
        ? Math.max(0, Number(value))
        : value,
    }));
  };

  const handleAddSupplier = () => {
    if (!tempSupplier.supplier) return;

    if (formData.suppliers.some((s) => s.supplier === tempSupplier.supplier)) {
      setError("Supplier already added.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      suppliers: [...prev.suppliers, tempSupplier],
    }));
    setTempSupplier({ supplier: "", purchasePrice: 0 });
    setError("");
  };

  const handleRemoveSupplier = (index) => {
    setFormData((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authFetch(`${API_BASE}/api/inventory`, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to add item");

      onItemAdded(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal">
        <h2 className="inventory-modal-title">Add Inventory Item</h2>
        {error && <div className="inventory-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="inventory-modal-form">
          {/* Item Name */}
          <div className="inventory-form-group">
            <label htmlFor="name">
              Item Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Item Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="inventory-input"
            />
          </div>

          {/* Initial Stock */}
          <div className="inventory-form-group">
            <label htmlFor="initialStock">
              Initial Stock <span className="required">*</span>
            </label>
            <input
              type="number"
              name="initialStock"
              id="initialStock"
              placeholder="Initial Stock"
              min="0"
              value={formData.initialStock}
              onChange={handleInputChange}
              required
              className="inventory-input"
            />
          </div>

          {/* Max Stock */}
          <div className="inventory-form-group">
            <label htmlFor="maxStock">
              Max Stock <span className="required">*</span>
            </label>
            <input
              type="number"
              name="maxStock"
              id="maxStock"
              placeholder="Max Stock"
              min="1"
              value={formData.maxStock}
              onChange={handleInputChange}
              required
              className="inventory-input"
            />
          </div>

          <p className="inventory-stock-status">
            Based on the initial stock and max stock, status is calculated.
            Status:{" "}
            {calculateStatus(
              formData.initialStock,
              formData.maxStock,
              formData.expirationDate
            )}
          </p>

          {/* Selling Price */}
          <div className="inventory-form-group">
            <label htmlFor="sellingPrice">
              Selling Price <span className="required">*</span>
            </label>
            <input
              type="number"
              name="sellingPrice"
              id="sellingPrice"
              placeholder="Selling Price"
              min="0"
              value={formData.sellingPrice}
              onChange={handleInputChange}
              required
              className="inventory-input"
            />
          </div>

          {/* Category */}
          <div className="inventory-form-group">
            <label htmlFor="category">
              Category <span className="required">*</span>
            </label>
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="inventory-select"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div className="inventory-form-group">
            <label htmlFor="unit">
              Unit <span className="required">*</span>
            </label>
            <select
              name="unit"
              id="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
              className="inventory-select"
            >
              <option value="">Select Unit</option>
              {uoms.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Expiration Date */}
          <div className="inventory-form-group">
            <label htmlFor="expirationDate">Expiration Date</label>
            <input
              type="date"
              name="expirationDate"
              id="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              className="inventory-input"
            />
          </div>

          {/* Suppliers Section */}
          <div className="inventory-suppliers-section">
            <h4 className="inventory-suppliers-title">Suppliers</h4>
            <div className="inventory-add-supplier-row">
              <select
                value={tempSupplier.supplier}
                onChange={(e) =>
                  setTempSupplier((prev) => ({
                    ...prev,
                    supplier: e.target.value,
                  }))
                }
                className="inventory-select"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Purchase Price"
                value={tempSupplier.purchasePrice}
                onChange={(e) =>
                  setTempSupplier((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value,
                  }))
                }
                className="inventory-input"
              />
              <button
                type="button"
                onClick={handleAddSupplier}
                className="inventory-add-btn"
              >
                <FaPlus />
              </button>
            </div>
            <ul className="inventory-suppliers-list">
              {formData.suppliers.map((s, index) => (
                <li key={index} className="inventory-supplier-item">
                  {suppliers.find((sup) => sup._id === s.supplier)?.name ||
                    "Unknown"}{" "}
                  - ₱{s.purchasePrice}{" "}
                  <button
                    type="button"
                    onClick={() => handleRemoveSupplier(index)}
                    className="inventory-remove-btn"
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="inventory-modal-actions">
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="inventory-submit-btn"
            >
              {loading ? "Adding..." : "Add Item"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inventory-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;
