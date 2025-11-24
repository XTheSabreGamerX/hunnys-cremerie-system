import React, { useState } from "react";
import "../styles/ReceiptModal.css";
import ConfirmationModal from "../components/ConfirmationModal";
import PopupMessage from "../components/PopupMessage";

const ReceiptModal = ({ sale, onClose, onRefund }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";
  const token = localStorage.getItem("token");

  const showPopup = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("success");
    }, 2000);
  };

  if (!sale) return null;

  const handlePrint = () => {
    const printContents =
      document.getElementById("receipt-content")?.innerHTML || "";

    const modifiedContents = printContents

      .replace(/(Date:.*<\/p>)/i, '$1<hr class="separator"/>')

      .replace(/<h3>Items<\/h3>/i, '<hr class="separator"/><h3>Items</h3>')

      .replace(/<\/ul>/i, '</ul><hr class="separator"/>')

      .replace(
        /<p>\s*<strong>Total:/i,
        '<hr class="separator"/><p><strong>Total:'
      );

    const html = `
    <html>
      <head>
        <title>Receipt Print</title>
        <meta charset="utf-8"/>
        <style>
          @page { size: 80mm auto; margin: 5mm; }
          body { font-family: Arial, sans-serif; margin:0; padding:6px; width:80mm; }
          h2, h3 { text-align:center; margin:4px 0; }
          ul { padding:0; margin:0; list-style:none; }
          li { padding:2px 0; font-size:13px; }
          p { margin:2px 0; font-size:12px; }
          .separator { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        </style>
      </head>
      <body>
        ${modifiedContents}
        <hr class="separator"/>
        <p className="receipt-center">Contact Us: 0928-191-5526</p>
        <p className="receipt-center">Find us at Facebook: https://www.facebook.com/hunnyscremerienew</p>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleRefund = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/sales/${sale._id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || "Refund failed");
      }

      if (onRefund) onRefund();
      showPopup("The sale has been refunded.", "success");
      setShowConfirm(false);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("[Refund Error]", err);
      showPopup(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {popupMessage && <PopupMessage message={popupMessage} type={popupType} />}

      {showConfirm && (
        <ConfirmationModal
          message="Are you sure you want to refund this sale?"
          onConfirm={handleRefund}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="receipt-overlay">
        <div className="receipt-container">
          <div id="receipt-content">
            <h2 className="receipt-center">Hunnys Crémerie Baking Supplies</h2>
            <p className="receipt-center">
              12 Torres St. Burgos 1860 Rodriguez, Philippines
            </p>
            <p>
              <strong>Sale ID:</strong> {sale.saleId}
            </p>
            <p>
              <strong>Customer:</strong> {sale.customerName}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(sale.createdAt).toLocaleDateString("en-PH", {
                timeZone: "Asia/Manila",
              })}
            </p>
            <hr />
            <h3>Items</h3>
            <ul>
              {sale.items.map((item, idx) => (
                <li key={idx}>
                  {item.name} x {item.quantity} @ ₱{item.price} = ₱
                  {item.price * item.quantity}
                </li>
              ))}
            </ul>
            <hr />
            <p>
              <strong>Subtotal:</strong> ₱{sale.subtotal?.toFixed(2)}
            </p>
            <p>
              <strong>Tax ({sale.taxRate}%):</strong> ₱
              {sale.taxAmount?.toFixed(2)}
            </p>
            <p>
              <strong>Total:</strong> ₱{sale.totalAmount?.toFixed(2)}
            </p>
            <p>
              <strong>Payment:</strong> {sale.paymentMethod}
            </p>
          </div>
          <div className="receipt-actions">
            <button onClick={() => setShowConfirm(true)} disabled={loading}>
              Refund
            </button>
            <button onClick={handlePrint} disabled={loading}>
              Print
            </button>
            <button onClick={onClose} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptModal;
