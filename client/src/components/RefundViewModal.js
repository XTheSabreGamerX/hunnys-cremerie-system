import React from "react";
import "../styles/RefundViewModal.css";

const RefundViewModal = ({ isOpen, onClose, refund }) => {
  if (!isOpen || !refund) return null;

  return (
    <div className="rvmodal-overlay">
      <div className="rvmodal-container">
        <h2 className="rvmodal-title">Refund Details</h2>

        {/* Status */}
        <div className="rvmodal-section">
          <strong>Status:</strong>{" "}
          <span className={`rvmodal-status ${refund.status}`}>
            {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
          </span>
        </div>

        {/* Reason */}
        <div className="rvmodal-section">
          <strong>Reason:</strong>
          <p className="rvmodal-reason">{refund.reason}</p>
        </div>

        {/* Refunded Items */}
        <div className="rvmodal-items-container">
          <h3 className="rvmodal-subtitle">Refunded Items</h3>
          <div className="rvmodal-items-header">
            <span>Item</span>
            <span>Qty</span>
            <span>Price</span>
            <span>Total</span>
          </div>

          {refund.refundedItems.map((item) => (
            <div key={item.itemId} className="rvmodal-item-row">
              <span>{item.name}</span>
              <span>{item.quantity}</span>
              <span>₱{item.sellingPrice.toFixed(2)}</span>
              <span>₱{(item.quantity * item.sellingPrice).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Total Refund */}
        <div className="rvmodal-total">
          Total Refund: <strong>₱{refund.totalRefundAmount.toFixed(2)}</strong>
        </div>

        {/* Processed Info */}
        <div className="rvmodal-processed-info">
          <small>
            Processed by: {refund.processedBy?.username || "Unknown"} |{" "}
            {new Date(refund.processedAt).toLocaleString()}
          </small>
        </div>

        {/* Close Button */}
        <div className="rvmodal-actions">
          <button className="rvmodal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundViewModal;