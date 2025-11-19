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

  useEffect(() => {
    if (mode === "edit" && item) {
      // Normalize Category
      const categoryId =
        typeof item.category === "object"
          ? item.category?._id || ""
          : categories.find((c) => c.name === item.category)?._id ||
            item.category ||
            "";

      // Normalize Unit
      const unitId = item.unit?._id || item.unit?.$oid || item.unit || "";

      // Normalize Suppliers
      const normalizedSuppliers =
        item.suppliers?.map((s) => ({
          supplier: s.supplier?._id || s.supplier?.$oid || s.supplier || "",
          purchasePrice: s.purchasePrice,
          _id: s._id?.$oid || s._id,
        })) || [];

      // Normalize expiration date
      const expirationDate = item.expirationDate?.$date
        ? item.expirationDate.$date.split("T")[0]
        : item.expirationDate?.split?.("T")[0] || "";

      setFormData({
        ...item,
        category: categoryId,
        unit: unitId,
        suppliers: normalizedSuppliers,
        expirationDate,
      });
    }
  }, [mode, item, categories]);

  /* const calculateStatus = (currentStock, threshold, expirationDate) => {
    const now = new Date();
    const expDate = expirationDate ? new Date(expirationDate) : null;

    if (expDate && expDate < now) return "Expired";
    if (currentStock <= 0) return "Out of stock";
    if (currentStock <= threshold * 0.1) return "Critical";
    if (currentStock <= threshold * 0.2) return "Low-stock";
    return "Well-stocked";
  }; */

  const isFormValid = () => {
    // Required fields
    if (!formData.name.trim() || !formData.category || !formData.unit)
      return false;

    // Stock & price checks
    if (formData.currentStock < 0 || formData.sellingPrice < 0) return false;

    if (formData.markup > 100) return false;

    // Expiration date validation
    if (formData.expirationDate) {
      const expDate = new Date(formData.expirationDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (expDate < now) return false;
    }

    return true;
  };

  useEffect(() => {
    if (mode === "add" && formData.name) {
      const categoryName =
        categories.find((c) => c._id === formData.category)?.name || "";
      if (!formData.itemId && categoryName) {
        const generateItemCode = (name, categoryName) => {
          const namePart = (name?.substring(0, 3) || "XXX").toUpperCase();
          const categoryPart = (
            categoryName?.substring(0, 3) || "XXX"
          ).toUpperCase();
          const randomPart = nanoid();
          return `${namePart}-${categoryPart}-${randomPart}`;
        };

        setFormData((prev) => ({
          ...prev,
          itemId: generateItemCode(prev.name, categoryName),
        }));
      }
    }
  }, [
    formData.name,
    formData.category,
    formData.itemId,
    categories,
    mode,
    nanoid,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        itemId: "",
        name: "",
        currentStock: 0,
        markup: 0,
        sellingPrice: 0,
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["currentStock", "sellingPrice"].includes(name)
        ? Math.max(0, Number(value))
        : value,
    }));
  };

  const calculateSellingPrice = (suppliers, markup) => {
    if (!suppliers || suppliers.length === 0) return 0;

    const preferred = suppliers.find((s) => s.isPreferred) || suppliers[0];
    if (!preferred) return 0;

    return Math.round(preferred.purchasePrice * (1 + markup / 100) * 100) / 100;
  };

  const handleSetPreferredSupplier = (index) => {
    setFormData((prev) => {
      const updatedSuppliers = prev.suppliers.map((s, i) => ({
        ...s,
        isPreferred: i === index,
      }));

      return {
        ...prev,
        suppliers: updatedSuppliers,
        sellingPrice: calculateSellingPrice(updatedSuppliers, prev.markup),
      };
    });
  };

  useEffect(() => {
    const newPrice = calculateSellingPrice(formData.suppliers, formData.markup);
    setFormData((prev) => ({
      ...prev,
      sellingPrice: newPrice,
    }));
  }, [formData.markup, formData.suppliers]);

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
      const isEdit = mode === "edit";
      const url = isEdit
        ? `${API_BASE}/api/inventory/${item._id}`
        : `${API_BASE}/api/inventory`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        note: formData.note || "",
        threshold: formData.currentStock,
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
                placeholder="Item Name"
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

            {/*  <p className="inventory-stock-status">
            Based on the initial stock and max stock, status is calculated.
            Status:{" "}
            {calculateStatus(
              formData.currentStock,
              formData.maxStock,
              formData.expirationDate
            )}
          </p> */}

            {/* Current Stock */}
            <div className="inventory-form-group">
              <label htmlFor="currentStock">
                Current Stock <span className="required">*</span>
              </label>
              <input
                type="number"
                name="currentStock"
                id="currentStock"
                placeholder="How many stocks is currently available"
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
                placeholder="How much the item sells for"
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
              {formData.suppliers.map((s, index) => {
                const supplierName =
                  suppliers.find((sup) => sup._id === s.supplier)?.name ||
                  "Unknown";
                const isPreferred = s.isPreferred;

                return (
                  <li key={index} className="inventory-supplier-item">
                    <button
                      type="button"
                      onClick={() => handleSetPreferredSupplier(index)}
                      className="inventory-preferred-btn"
                    >
                      {isPreferred ? <FaStar color="#FFD700" /> : <FaRegStar />}
                    </button>
                    {supplierName} - ₱{s.purchasePrice}{" "}
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

          {mode === "edit" && (
            <div className="inventory-note-group">
              <label htmlFor="note">Edit Note (optional)</label>
              <textarea
                name="note"
                id="note"
                placeholder="Reason for editing this item..."
                value={formData.note || ""}
                onChange={handleInputChange}
                className="inventory-input"
                rows="4"
                style={{ width: "100%" }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="inventory-modal-actions">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;
