import React from "react";
import "../styles/InventoryViewModal.css";

const InventoryViewModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="inv-modal-overlay">
      <div className="inv-modal-container">
        {/* HEADER */}
        <div className="inv-modal-header">
          <h2 className="inv-modal-title">{item.name}</h2>
          <button className="inv-modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* BODY */}
        <div className="inv-modal-content">
          <table className="inv-modal-details-table">
            <tbody>
              <tr>
                <td>Item ID:</td>
                <td>{item.itemId}</td>
              </tr>
              <tr>
                <td>Category:</td>
                <td>{item.category}</td>
              </tr>
              <tr>
                <td>Current Stock:</td>
                <td>{item.currentStock}</td>
              </tr>
              <tr>
                <td>Threshold:</td>
                <td>{item.threshold}</td>
              </tr>
              <tr>
                <td>Markup (%):</td>
                <td>{item.markup}</td>
              </tr>
              <tr>
                <td>Selling Price:</td>
                <td>{item.sellingPrice}</td>
              </tr>
              <tr>
                <td>Status:</td>
                <td>{item.status}</td>
              </tr>
              <tr>
                <td>Expiration Date:</td>
                <td>
                  {item.expirationDate
                    ? new Date(item.expirationDate).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>Suppliers:</td>
                <td>
                  {item.suppliers?.map((s) => (
                    <div key={s._id}>
                      {s.supplier?.name || s.supplier || "Unknown Supplier"} - ₱
                      {s.purchasePrice}
                      {s.isPreferred && <span> (Preferred)</span>}
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOOTER – Stock History */}
        <div className="inv-modal-footer">
          <h3>Item History</h3>
          {item.stockHistory && item.stockHistory.length > 0 ? (
            <table className="inv-stock-history-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Previous Stock</th>
                  <th>New Stock</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {item.stockHistory
                  .slice()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((entry) => (
                    <tr key={entry._id}>
                      <td>{entry.type}</td>
                      <td>{entry.quantity}</td>
                      <td>{entry.previousStock}</td>
                      <td>{entry.newStock}</td>
                      <td>{new Date(entry.date).toLocaleString()}</td>
                      <td>{entry.note || "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p>No stock history available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryViewModal;
