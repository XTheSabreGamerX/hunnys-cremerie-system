import React from "react";
import "../styles/ViewModal.css";

const ViewModal = ({ item, fields, onClose, onDelete }) => {
  if (!item) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content view-modal">
        <h2>Details</h2>
        <div className="modal-details">
          {fields.map((field) => (
            <div key={field.name} className="modal-field">
              <label>{field.label}:</label>
              <span>
                {field.render
                  ? field.render(item[field.name])
                  : field.formatter
                  ? field.formatter(item[field.name])
                  : item[field.name] ?? "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button
            className="customer-btn delete-btn"
            onClick={() => onDelete(item)}
          >
            Delete
          </button>
          <button className="customer-btn close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
