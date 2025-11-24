import React from "react";
import { X, Package } from "lucide-react";

const InventoryViewModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-primary" /> {item.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Item ID:</span>{" "}
              <span className="font-mono font-medium">{item.itemId}</span>
            </div>
            <div>
              <span className="text-gray-500">Category:</span>{" "}
              <span className="font-medium">{item.category}</span>
            </div>
            <div>
              <span className="text-gray-500">Stock:</span>{" "}
              <span className="font-medium">{item.currentStock}</span>
            </div>
            <div>
              <span className="text-gray-500">Price:</span>{" "}
              <span className="font-medium text-brand-primary font-bold">
                ₱{item.sellingPrice}
              </span>
            </div>
          </div>

          {/* Suppliers */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Suppliers</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              {item.suppliers?.map((s, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{s.supplier?.name || s.supplier || "Unknown"}</span>
                  <span className="font-mono">₱{s.purchasePrice}</span>
                </div>
              ))}
              {(!item.suppliers || item.suppliers.length === 0) && (
                <p className="text-gray-400 italic">No suppliers linked.</p>
              )}
            </div>
          </div>

          {/* History Table */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              Stock History
            </h3>
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.stockHistory
                    ?.slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5)
                    .map((h, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{h.type}</td>
                        <td
                          className={`px-3 py-2 font-bold ${
                            h.quantity > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {h.quantity > 0 ? "+" : ""}
                          {h.quantity}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(h.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  {(!item.stockHistory || item.stockHistory.length === 0) && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-3 py-4 text-center text-gray-400"
                      >
                        No history available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryViewModal;
