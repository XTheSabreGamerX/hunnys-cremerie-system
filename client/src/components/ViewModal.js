import React from "react";
import { X, Trash2 } from "lucide-react";

const ViewModal = ({ item, fields, onClose, onDelete }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Item Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {fields.map((field) => (
            <div
              key={field.name}
              className="flex justify-between border-b border-gray-50 pb-2"
            >
              <span className="text-gray-500 text-sm">{field.label}</span>
              <span className="font-medium text-gray-800 text-right">
                {field.render
                  ? field.render(item[field.name])
                  : item[field.name] || "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Delete Item
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
