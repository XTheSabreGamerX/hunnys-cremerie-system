import React, { useState, useEffect } from "react";
import "../styles/EditModal.css";

const EditModal = ({
  item,
  fields,
  onSave,
  onClose,
  mode = "edit",
  modalType = "default",
  allItems = [],
  itemForm,
  setItemForm,
  setPopupMessage,
  setPopupType,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && item) {
      return {
        ...item,
        items: item.items || [],
      };
    }

    return {
      customerName: "",
      taxRate: 0,
      date: new Date().toISOString().split("T")[0],
      items: [],
    };
  });

  useEffect(() => {
    if (item && modalType !== "sale") {
      setFormData(item);
    } else if (!item && modalType !== "sale") {
      setFormData({});
    }
  }, [item, modalType]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const selected = allItems.find((i) => i.itemId === itemForm.itemId);

    if (!selected) {
      setPopupMessage("Invalid item selected.");
      setPopupType("error");
      return;
    }

    const stock = selected.stock ?? 0;

    if (stock === 0) {
      setPopupMessage(`"${selected.name}" is out of stock.`);
      setPopupType("error");
      return;
    }

    if (itemForm.quantity > stock) {
      setPopupMessage(
        `Cannot add ${itemForm.quantity} units. Only ${stock} in stock for "${selected.name}".`
      );
      setPopupType("error");
      return;
    }

    const newItem = {
      itemId: selected.itemId,
      name: selected.name,
      quantity: itemForm.quantity,
      price: Number(selected.unitPrice) || 0,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setItemForm({ itemId: "", quantity: 1 });
  };

  const normalizeValue = (fieldName, value, options) => {
    if (!value) return "";
    if (options?.some((opt) => opt.value === value)) return value;
    const match = options?.find((opt) => opt.label === value);
    return match ? match.value : value;
  };

  return (
    <div className="inventory-modal-overlay">
      <div className="inventory-modal-content">
        <h2>
          {mode === "add"
            ? `Add New ${
                modalType.charAt(0).toUpperCase() + modalType.slice(1)
              }`
            : `Edit ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
        </h2>

        <form onSubmit={handleSubmit}>
          {modalType === "sale" ? (
            <>
              {fields.map((field) => (
                <div key={field.name} className="inventory-form-group">
                  <label>
                    {field.label}{" "}
                    {field.required && <span style={{ color: "red" }}>*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
                      className="inventory-input"
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      className="inventory-input"
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      min={field.type === "number" ? 0 : undefined}
                      step={field.type === "number" ? "any" : undefined}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}

              <div className="inventory-form-group">
                <label htmlFor="item">Inventory Item:</label>
                <select
                  className="inventory-input"
                  value={itemForm.itemId}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, itemId: e.target.value })
                  }
                >
                  <option value="">-- Select Item --</option>
                  {allItems.map((item) => (
                    <option key={item.itemId} value={item.itemId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inventory-form-group">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  type="number"
                  className="inventory-input"
                  value={itemForm.quantity}
                  min="1"
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value),
                    }))
                  }
                />
              </div>

              <div
                className="inventory-form-group"
                style={{ marginTop: "10px" }}
              >
                <button
                  type="button"
                  className="inventory-btn add-item-btn"
                  onClick={handleAddItem}
                >
                  + Add Item
                </button>
              </div>

              <div className="inventory-item-list">
                {formData.items.map((item, index) => (
                  <div key={index} className="inventory-item-row">
                    {item.name} x {item.quantity} = ₱
                    {(item.quantity * item.price).toFixed(2)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            fields.map((field) => (
              <div key={field.name} className="inventory-form-group">
                <label>
                  {field.label}{" "}
                  {field.required && <span style={{ color: "red" }}>*</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    className="inventory-input"
                    value={normalizeValue(
                      field.name,
                      formData[field.name],
                      field.options
                    )}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || "text"}
                    className="inventory-input"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    min={field.type === "number" ? 0 : undefined}
                    step={field.type === "number" ? "any" : undefined}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))
          )}

          <div className="inventory-modal-buttons">
            <button
              type="submit"
              className="inventory-btn save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inventory-btn cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
