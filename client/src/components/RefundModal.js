import React, { useState, useEffect } from 'react';
import "../styles/RefundModal.css"

const RefundModal = ({ isOpen, onClose, saleData, onSubmit }) => {
  const [refundStatus, setRefundStatus] = useState('');
  const [reason, setReason] = useState('');
  const [refundedItems, setRefundedItems] = useState([]);
  const [totalRefundAmount, setTotalRefundAmount] = useState(0);

  useEffect(() => {
    if (saleData) {
      const formatted = saleData.items.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        quantity: 0,
        sellingPrice: item.sellingPrice
      }));

      setRefundedItems(formatted);
      setRefundStatus('');
      setReason('');
      setTotalRefundAmount(0);
    }
  }, [saleData]);

  const handleQuantityChange = (index, value) => {
    const updated = [...refundedItems];
    const qty = Math.max(0, Math.min(value, saleData.items[index].quantity));

    updated[index].quantity = qty;
    setRefundedItems(updated);
    calculateTotal(updated);
  };

  const calculateTotal = (items) => {
    const total = items.reduce(
      (sum, item) => sum + item.quantity * item.sellingPrice,
      0
    );
    setTotalRefundAmount(total);
  };

  // ---------------- VALIDATION ----------------
  const hasRefundItems = refundedItems.some((i) => i.quantity > 0);
  const isValid = refundStatus && reason.trim() !== "" && hasRefundItems;

  const handleSubmit = () => {
    if (!isValid) return;

    onSubmit({
      status: refundStatus,
      reason,
      refundedItems: refundedItems.filter((i) => i.quantity > 0),
      totalRefundAmount
    });
  };

  if (!isOpen) return null;

  return (
    <div className="refund-modal-overlay">
      <div className="refund-modal-container">
        <h2 className="refund-modal-title">Process Refund</h2>

        {/* STATUS */}
        <div className="refund-modal-section">
          <label className="refund-modal-label">Refund Status</label>
          <select
            className="refund-modal-select"
            value={refundStatus}
            onChange={(e) => setRefundStatus(e.target.value)}
          >
            <option value="">Select a status</option>
            <option value="refunded">Refunded</option>
            <option value="defective">Defective</option>
            <option value="replaced">Replaced</option>
          </select>
        </div>

        {/* REASON */}
        <div className="refund-modal-section">
          <label className="refund-modal-label">Reason</label>
          <textarea
            className="refund-modal-textarea"
            placeholder="Enter refund reason…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* ITEMS */}
        <div className="refund-modal-items-container">
          <h3 className="refund-modal-subtitle">Refund Items</h3>

          <div className="refund-modal-items-header">
            <span>Item</span>
            <span>Price</span>
            <span>Max Qty</span>
            <span>Refund Qty</span>
          </div>

          {refundedItems.map((item, index) => (
            <div key={item.itemId} className="refund-modal-item-row">
              <span>{item.name}</span>
              <span>₱{item.sellingPrice.toFixed(2)}</span>
              <span>{saleData.items[index].quantity}</span>

              <input
                type="number"
                min="0"
                max={saleData.items[index].quantity}
                value={item.quantity}
                onChange={(e) =>
                  handleQuantityChange(index, parseInt(e.target.value))
                }
                className="refund-modal-qty-input"
              />
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className="refund-modal-total">
          Total Refund: <strong>₱{totalRefundAmount.toFixed(2)}</strong>
        </div>

        {/* ACTION BUTTONS */}
        <div className="refund-modal-actions">
          <button className="refund-modal-cancel-btn" onClick={onClose}>
            Cancel
          </button>

          <button
            className={`refund-modal-submit-btn ${!isValid ? "disabled" : ""}`}
            disabled={!isValid}
            onClick={handleSubmit}
          >
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;