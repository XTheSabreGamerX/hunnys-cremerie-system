import React, { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
import { showToast } from "../components/ToastContainer";

const PurchaseOrderReceiveModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSubmit,
}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!purchaseOrder?.items) return;
    setItems(
      purchaseOrder.items.map((poItem) => ({
        itemId: poItem.item._id,
        name: poItem.item.name,
        orderedQty: poItem.orderedQty,
        receivedQty: poItem.receivedQty,
        remainingQty: poItem.orderedQty - poItem.receivedQty,
        inputQty: "",
        expirationDate: "",
      }))
    );
  }, [purchaseOrder]);

  if (!isOpen || !purchaseOrder) return null;

  const handleInput = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = () => {
    const payload = items
      .filter((i) => Number(i.inputQty) > 0)
      .map((i) => ({
        itemId: i.itemId,
        receivedQty: Number(i.inputQty),
        expirationDate: i.expirationDate || null,
      }));

    if (payload.length === 0) {
      showToast({ message: "Enter at least one quantity.", type: "warning" });
      return;
    }
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800">
            Receive PO #{purchaseOrder.poNumber}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Item</th>
                <th className="px-4 py-3">Ordered</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Receive Now</th>
                <th className="px-4 py-3 rounded-r-lg">Expiration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((row, idx) => (
                <tr key={row.itemId}>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.orderedQty}</td>
                  <td className="px-4 py-3">{row.receivedQty}</td>
                  <td className="px-4 py-3">{row.remainingQty}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max={row.remainingQty}
                      value={row.inputQty}
                      onChange={(e) =>
                        handleInput(idx, "inputQty", e.target.value)
                      }
                      disabled={row.remainingQty === 0}
                      className="w-20 px-2 py-1 border rounded-lg text-center outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={row.expirationDate}
                      onChange={(e) =>
                        handleInput(idx, "expirationDate", e.target.value)
                      }
                      disabled={row.remainingQty === 0}
                      className="px-2 py-1 border rounded-lg outline-none disabled:bg-gray-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderReceiveModal;
