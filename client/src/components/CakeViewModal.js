import React from "react";
import { X } from "lucide-react";

const CakeViewModal = ({ cake, onClose }) => {
  if (!cake) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{cake.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status:</span>{" "}
              <span className="font-medium">{cake.status}</span>
            </div>
            <div>
              <span className="text-gray-500">Price:</span>{" "}
              <span className="font-bold text-brand-primary">
                ₱{cake.price?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Availability:</span>{" "}
              <span className="font-medium">{cake.availability}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              Ingredients
            </h3>
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cake.ingredients?.map((ing, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        {ing.inventoryItem?.name || "Unknown"}
                      </td>
                      <td className="px-3 py-2 text-right">{ing.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CakeViewModal;
