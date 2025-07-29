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
}) => {
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
  }, [item, modalType, setFormData]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  console.log("modalType:", modalType);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
                <div key={field.name} className="form-group">
                  <label>
                    {field.label}{" "}
                    {field.required && <span style={{ color: "red" }}>*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
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
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      min={field.type === "number" ? 0 : undefined}
                      step={field.type === "number" ? "any" : undefined}
                    />
                  )}
                </div>
              ))}

              <div className="form-row">
                <label htmlFor="item">Inventory Item:</label>
                <select
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

              <div className="form-row">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  type="number"
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

              <button
                type="button"
                className="module-add-btn"
                onClick={() => {
                  const selected = allItems.find(
                    (i) => i.itemId === itemForm.itemId
                  );
                  if (!selected) return;

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
                }}
              >
                + Add Item
              </button>

              <div className="item-list">
                {formData.items.map((item, index) => (
                  <div key={index} className="item-row">
                    {item.name} x {item.quantity} = ₱
                    {(item.quantity * item.price).toFixed(2)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Default Add modal mode for non-sales
            fields.map((field) => (
              <div key={field.name} className="form-group">
                <label>
                  {field.label}{" "}
                  {field.required && <span style={{ color: "red" }}>*</span>}
                </label>
                {field.type === "select" ? (
                  <select
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
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    min={field.type === "number" ? 0 : undefined}
                    step={field.type === "number" ? "any" : undefined}
                  />
                )}
              </div>
            ))
          )}

          <div className="modal-buttons">
            <button type="submit" className="modal-save">
              Save
            </button>
            <button type="button" onClick={onClose} className="modal-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
