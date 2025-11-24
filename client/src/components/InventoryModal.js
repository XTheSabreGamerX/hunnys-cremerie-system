import React, { useState, useEffect } from "react";
import { customAlphabet } from "nanoid/non-secure";
import { FaPlus, FaTrash, FaStar, FaRegStar } from "react-icons/fa";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import "../styles/InventoryModal.css";

const InventoryModal = ({
  isOpen,
  onClose,
  categories,
  uoms,
  suppliers,
  onItemAdded,
  mode = "add",
  item = null,
}) => {
  const [formData, setFormData] = useState({
    itemId: "",
    name: "",
    currentStock: 0,
    markup: 0,
    sellingPrice: 0,
    lastManualPrice: 0,
    category: "",
    unit: "",
    expirationDate: "",
    suppliers: [],
    note: "",
  });

  const [tempSupplier, setTempSupplier] = useState({
    supplier: "",
    purchasePrice: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nanoid = customAlphabet("0123456789", 6);

  // ------------------------- EDIT MODE INITIALIZATION -------------------------
  useEffect(() => {
    if (mode === "edit" && item) {
      const categoryId =
        typeof item.category === "object"
          ? item.category?._id || ""
          : categories.find((c) => c.name === item.category)?._id ||
            item.category ||
            "";

      const unitId = item.unit?._id || item.unit?.$oid || item.unit || "";

      const normalizedSuppliers =
        item.suppliers?.map((s) => ({
          supplier: s.supplier?._id || s.supplier?.$oid || s.supplier || "",
          purchasePrice: s.purchasePrice,
          _id: s._id?.$oid || s._id,
          isPreferred: s.isPreferred || false,
        })) || [];

      const expirationDate = item.expirationDate?.$date
        ? item.expirationDate.$date.split("T")[0]
        : item.expirationDate?.split?.("T")[0] || "";

      // Set form data
      setFormData({
        ...item,
        category: categoryId,
        unit: unitId,
        suppliers: normalizedSuppliers,
        expirationDate,
        sellingPrice: item.lastManualPrice ?? item.sellingPrice,
        lastManualPrice: item.lastManualPrice ?? item.sellingPrice,
      });
    }
  }, [mode, item, categories]);

  // ------------------------- RESET MODAL -------------------------
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        itemId: "",
        name: "",
        currentStock: 0,
        markup: 0,
        sellingPrice: 0,
        lastManualPrice: 0,
        category: "",
        unit: "",
        expirationDate: "",
        suppliers: [],
        note: "",
      });
      setTempSupplier({ supplier: "", purchasePrice: 0 });
      setError("");
    }
  }, [isOpen]);

  // ------------------------- ITEM ID GENERATION -------------------------
  useEffect(() => {
    if (mode === "add" && formData.name && formData.category) {
      const generateItemCode = (name, categoryName) => {
        const namePart = (name?.substring(0, 3) || "XXX").toUpperCase();
        const categoryPart = (
          categoryName?.substring(0, 3) || "XXX"
        ).toUpperCase();
        const randomPart = nanoid();
        return `${namePart}-${categoryPart}-${randomPart}`;
      };
      const categoryName =
        categories.find((c) => c._id === formData.category)?.name || "";
      setFormData((prev) => ({
        ...prev,
        itemId: generateItemCode(prev.name, categoryName),
      }));
    }
  }, [formData.name, formData.category, mode, categories, nanoid]);

  // ------------------------- FORM VALIDATION -------------------------
  const isFormValid = () => {
    if (!formData.name.trim() || !formData.category || !formData.unit)
      return false;
    if (formData.currentStock < 0 || formData.sellingPrice < 0) return false;
    if (formData.markup > 100) return false;
    if (formData.expirationDate) {
      const expDate = new Date(formData.expirationDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (expDate < now) return false;
    }
    return true;
  };

  // ------------------------- INPUT CHANGE -------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "sellingPrice") {
        const typedPrice = parseFloat(value) || 0;
        updated.lastManualPrice = typedPrice;
      }

      if (name === "markup") {
        updated.markup = parseFloat(value) || 0;
        const preferred = prev.suppliers.find((s) => s.isPreferred);
        if (preferred) {
          updated.sellingPrice =
            preferred.purchasePrice * (1 + updated.markup / 100);
        }
      }

      return updated;
    });
  };

  // ------------------------- ADD / REMOVE SUPPLIER -------------------------
  const handleAddSupplier = () => {
    if (!tempSupplier.supplier || tempSupplier.purchasePrice === 0) return;
    if (formData.suppliers.some((s) => s.supplier === tempSupplier.supplier)) {
      setError("Supplier already added.");
      return;
    }
    setFormData((prev) => {
      const updatedSuppliers = [
        ...prev.suppliers,
        { ...tempSupplier, isPreferred: prev.suppliers.length === 0 },
      ];
      const preferred = updatedSuppliers.find((s) => s.isPreferred);
      return {
        ...prev,
        suppliers: updatedSuppliers,
        sellingPrice: preferred.purchasePrice * (1 + prev.markup / 100),
      };
    });
    setTempSupplier({ supplier: "", purchasePrice: 0 });
    setError("");
  };

  const handleRemoveSupplier = (index) => {
    setFormData((prev) => {
      const updatedSuppliers = prev.suppliers.filter((_, i) => i !== index);
      if (
        !updatedSuppliers.some((s) => s.isPreferred) &&
        updatedSuppliers.length > 0
      ) {
        updatedSuppliers[0].isPreferred = true;
      }
      const preferred = updatedSuppliers.find((s) => s.isPreferred);
      return {
        ...prev,
        suppliers: updatedSuppliers,
        sellingPrice: preferred
          ? preferred.purchasePrice * (1 + prev.markup / 100)
          : prev.sellingPrice,
      };
    });
  };

  const handleSetPreferredSupplier = (index) => {
    setFormData((prev) => {
      const updatedSuppliers = prev.suppliers.map((s, i) => ({
        ...s,
        isPreferred: i === index,
      }));
      const preferred = updatedSuppliers.find((s) => s.isPreferred);
      return {
        ...prev,
        suppliers: updatedSuppliers,
        sellingPrice: preferred.purchasePrice * (1 + prev.markup / 100),
      };
    });
  };

  // ------------------------- SUBMIT -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const isEdit = mode === "edit";
      const url = isEdit
        ? `${API_BASE}/api/inventory/${item._id}`
        : `${API_BASE}/api/inventory`;
      const method = isEdit ? "PUT" : "POST";

      const categoryName =
        categories.find((c) => c._id === formData.category)?.name || "";

      const payload = {
        ...formData,
        category: categoryName,
        threshold: formData.currentStock,
        note: formData.note || "",
        sellingPrice: parseFloat(Number(formData.sellingPrice) || 0).toFixed(2),
        lastManualPrice: parseFloat(
          Number(formData.lastManualPrice) || 0
        ).toFixed(2),
      };

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save item");

      onItemAdded?.(data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal">
        <h2 className="inventory-modal-title">
          {mode === "edit" ? "Edit Inventory Item" : "Add Inventory Item"}
        </h2>
        {error && <div className="inventory-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="inventory-modal-form">
          <div className="inventory-top-fields">
            {/* Item Name */}
            <div className="inventory-form-group">
              <label htmlFor="name">
                Item Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="inventory-input"
              />
            </div>

            {/* Markup */}
            <div className="inventory-form-group">
              <label htmlFor="markup">Markup (%)</label>
              <input
                type="number"
                name="markup"
                id="markup"
                min="0"
                max="100"
                value={formData.markup}
                onChange={handleInputChange}
                className="inventory-input"
              />
            </div>

            {/* Current Stock */}
            <div className="inventory-form-group">
              <label htmlFor="currentStock">
                Current Stock <span className="required">*</span>
              </label>
              <input
                type="number"
                name="currentStock"
                id="currentStock"
                min="0"
                value={formData.currentStock}
                onChange={handleInputChange}
                required
                className="inventory-input"
              />
            </div>

            {/* Selling Price */}
            <div className="inventory-form-group">
              <label htmlFor="sellingPrice">
                Selling Price ₱ <span className="required">*</span>
              </label>
              <input
                type="number"
                name="sellingPrice"
                id="sellingPrice"
                min="0"
                step="0.01"
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
                    purchasePrice: Number(e.target.value),
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
              {formData.suppliers.map((s, index) => {
                const supplierName =
                  suppliers.find((sup) => sup._id === s.supplier)?.name ||
                  "Unknown";
                return (
                  <li key={index} className="inventory-supplier-item">
                    <button
                      type="button"
                      onClick={() => handleSetPreferredSupplier(index)}
                      className="inventory-preferred-btn"
                    >
                      {s.isPreferred ? (
                        <FaStar color="#FFD700" />
                      ) : (
                        <FaRegStar />
                      )}
                    </button>
                    {supplierName} - ₱{s.purchasePrice}
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplier(index)}
                      className="inventory-remove-btn"
                    >
                      <FaTrash />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Edit Note */}
          {mode === "edit" && (
            <div className="inventory-note-group">
              <label htmlFor="note">Edit Note (optional)</label>
              <textarea
                name="note"
                id="note"
                placeholder="Reason for editing..."
                value={formData.note}
                onChange={handleInputChange}
                className="inventory-input"
                rows="4"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="inventory-modal-actions">
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="inventory-submit-btn"
            >
              {loading
                ? mode === "edit"
                  ? "Saving..."
                  : "Adding..."
                : mode === "edit"
                ? "Save Changes"
                : "Add Item"}
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
