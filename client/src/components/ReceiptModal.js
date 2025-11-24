import React, { useState } from "react";
import { X, Printer, RotateCcw } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import PopupMessage from "../components/PopupMessage";
import { API_BASE } from "../utils/tokenUtils";

const ReceiptModal = ({ sale, onClose, onRefund }) => {
  // Removed unused loading state
  const [showConfirm, setShowConfirm] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const token = localStorage.getItem("token");

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => setPopupMessage(""), 2000);
  };

  if (!sale) return null;

  const handlePrint = () => {
    const printContents = document.getElementById("receipt-content")?.innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            h2, p { text-align: center; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 5px 0; }
            .total-row { font-weight: bold; border-top: 1px dashed #000; }
            hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleRefund = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sales/${sale._id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "refunded",
          reason: "Customer Request",
        }), // Default reason
      });

      if (!response.ok) throw new Error("Refund failed");

      if (onRefund) onRefund();
      showPopup("Sale refunded successfully.", "success");
      setShowConfirm(false);
      setTimeout(onClose, 2000);
    } catch (err) {
      showPopup(err.message, "error");
    }
  };

  return (
    <>
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />
      )}

      {showConfirm && (
        <ConfirmationModal
          message="Are you sure you want to refund this sale?"
          onConfirm={handleRefund}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">Sale Receipt</h2>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-6 overflow-y-auto bg-gray-50 flex justify-center">
            <div
              id="receipt-content"
              className="bg-white p-6 shadow-sm border border-gray-200 w-full font-mono text-sm"
            >
              <h2 className="text-center font-bold text-lg">
                Hunny's Crémerie
              </h2>
              <p className="text-center text-xs text-gray-500 mb-4">
                12 Torres St. Burgos 1860 Rodriguez, PH
              </p>

              <div className="space-y-1 mb-4 text-xs border-b border-dashed pb-2">
                <div className="flex justify-between">
                  <span>Inv #:</span> <span>{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>{" "}
                  <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span> <span>{sale.customerName}</span>
                </div>
              </div>

              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-dashed">
                    <th className="pb-1">Item</th>
                    <th className="text-right pb-1">Qty</th>
                    <th className="text-right pb-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{item.name}</td>
                      <td className="text-right py-1">{item.quantity}</td>
                      <td className="text-right py-1">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed pt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>{" "}
                  <span>₱{sale.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span> <span>₱{sale.taxAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed">
                  <span>Total:</span>
                  <span>₱{sale.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-white flex justify-between gap-3">
            {!sale.refund?.status && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" /> Refund
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptModal;
