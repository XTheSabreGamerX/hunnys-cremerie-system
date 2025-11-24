import React, { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

const RefundModal = ({ isOpen, onClose, saleData, onSubmit }) => {
  const [refundStatus, setRefundStatus] = useState("");
  const [reason, setReason] = useState("");
  const [refundedItems, setRefundedItems] = useState([]);
  const [totalRefundAmount, setTotalRefundAmount] = useState(0);

  useEffect(() => {
    if (saleData) {
      const formatted = saleData.items.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        quantity: 0,
        sellingPrice: item.sellingPrice || item.price, // Handle both field names
      }));
      setRefundedItems(formatted);
      setRefundStatus("");
      setReason("");
      setTotalRefundAmount(0);
    }
  }, [saleData]);

  const handleQuantityChange = (index, value) => {
    const updated = [...refundedItems];
    const qty = Math.max(0, Math.min(value, saleData.items[index].quantity));
    updated[index].quantity = qty;
    setRefundedItems(updated);

    const total = updated.reduce(
      (sum, item) => sum + item.quantity * item.sellingPrice,
      0
    );
    setTotalRefundAmount(total);
  };

  const handleSubmit = () => {
    if (!refundStatus || !reason || totalRefundAmount <= 0) return;
    onSubmit({
      status: refundStatus,
      reason,
      refundedItems: refundedItems.filter((i) => i.quantity > 0),
      totalRefundAmount,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-red-50">
          <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Process Refund
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-red-400 hover:text-red-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={refundStatus}
              onChange={(e) => setRefundStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Select Action</option>
              <option value="refunded">Refund (Return Money)</option>
              <option value="defective">Mark Defective</option>
              <option value="replaced">Replace Item</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-200"
              rows="2"
              placeholder="Why is this being refunded?"
            ></textarea>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 flex justify-between">
              <span>Item</span>
              <span>Refund Qty</span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {refundedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 border-b last:border-0 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Sold: {saleData.items[idx].quantity} @ ₱
                      {item.sellingPrice}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={saleData.items[idx].quantity}
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(idx, parseInt(e.target.value) || 0)
                    }
                    className="w-16 px-2 py-1 border rounded text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 text-lg">
            <span className="font-bold text-gray-700">Total Refund:</span>
            <span className="font-bold text-red-600">
              ₱{totalRefundAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!refundStatus || totalRefundAmount <= 0}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
