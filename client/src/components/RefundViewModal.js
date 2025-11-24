import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, User, Calendar, Clock, Package } from "lucide-react";

const RefundViewModal = ({ isOpen, onClose, refund }) => {
  // --- Animation Variants ---
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  // --- Helper for Status Colors ---
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "refunded":
        return "bg-green-100 text-green-800 border-green-200";
      case "defective":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "replaced":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && refund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-primary/10 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-brand-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  Refund Details
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Status & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </label>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                        refund.status
                      )}`}
                    >
                      {refund.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Reason
                  </label>
                  <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {refund.reason || "No reason provided"}
                  </p>
                </div>
              </div>

              {/* Refunded Items Table */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-700">
                    Refunded Items
                  </h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {refund.refundedItems.map((item) => (
                        <tr key={item.itemId}>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            ₱{item.sellingPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">
                            ₱{(item.quantity * item.sellingPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Refund Amount */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-semibold text-gray-600">
                  Total Refund Amount
                </span>
                <span className="text-xl font-bold text-brand-primary">
                  ₱{refund.totalRefundAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer / Processed Info */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>
                  Processed by:{" "}
                  <span className="font-medium text-gray-700">
                    {refund.processedBy?.username || "Unknown"}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(refund.processedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(refund.processedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RefundViewModal;
