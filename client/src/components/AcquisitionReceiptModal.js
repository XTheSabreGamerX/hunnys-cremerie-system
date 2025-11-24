import React, { useState, useMemo } from "react";
import { X, CheckCircle, XCircle } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";

const AcquisitionReceiptModal = ({
  acquisition,
  onClose,
  suppliers,
  onConfirm,
  onCancel,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);

  const supplierMap = useMemo(() => {
    return (suppliers || []).reduce((acc, s) => {
      acc[s._id] = s.name;
      return acc;
    }, {});
  }, [suppliers]);

  if (!acquisition) return null;

  const handleAction = (type) => {
    setActionType(type);
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === "confirm") {
        await onConfirm?.(acquisition);
      } else {
        await onCancel?.(acquisition);
      }
      setShowConfirm(false);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {showConfirm && (
        <ConfirmationModal
          message={
            actionType === "confirm"
              ? "Confirm acquisition?"
              : "Cancel acquisition?"
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">Acquisition Details</h2>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">ID:</span>{" "}
                <span className="font-medium">{acquisition.acquisitionId}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{" "}
                <span className="font-medium">{acquisition.status}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Supplier:</span>{" "}
                <span className="font-medium">
                  {supplierMap[acquisition.supplier] || acquisition.supplier}
                </span>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Cost</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {acquisition.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        ₱{item.unitCost?.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        ₱{(item.quantity * item.unitCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4 border-t font-bold text-lg">
              <span>Total:</span>
              <span>
                ₱
                {(acquisition.totalAmount || acquisition.subtotal || 0).toFixed(
                  2
                )}
              </span>
            </div>
          </div>

          {acquisition.status === "Pending" && (
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => handleAction("cancel")}
                className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex justify-center items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={() => handleAction("confirm")}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex justify-center items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AcquisitionReceiptModal;
