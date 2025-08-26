import React, { useState } from "react";
import "../styles/ReceiptModal.css";
import ConfirmationModal from "../components/ConfirmationModal";
import PopupMessage from "../components/PopupMessage";

const ReceiptModal = ({ sale, onClose, onRefund }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
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
      .replace(
        /<h3>Items<\/h3>/i,
        '<p style="text-align:center; margin:6px 4px;">----------------------------------------</p><h3>Items</h3>'
      )
      .replace(
        /<\/ul>/i,
        '</ul><p style="text-align:center; margin:6px 4px;">----------------------------------------</p>'
      )
      .replace(
        /<p>\s*<strong>Total:/i,
        '<p style="text-align:center; margin:6px 4px;">----------------------------------------</p><p><strong>Total:'
      );

    const html = `
      <html>
        <head>
          <title>Receipt</title>
          <meta charset="utf-8"/>
          <style>
            @page { size: 80mm auto; margin: 5mm; }
            body { font-family: Arial, sans-serif; margin:0; padding:6px; width:80mm; }
            h2, h3 { text-align:center; margin:4px 0; }
            ul { padding:0; margin:0; list-style:none; }
            li { padding:2px 0; font-size:13px; }
            p { margin:2px 0; font-size:12px; }
            .separator { text-align:center; margin:6px 4px; }
          </style>
        </head>
        <body>
          ${modifiedContents}
          <p class="separator">----------------------------------------</p>
          <p style="text-align:center; font-size:12px;">Thank you for your purchase!</p>
        </body>
      </html>
    `;

    const newWindow = window.open("", "", "width=600,height=800");
    if (!newWindow) {
      alert("Unable to open print window. Please allow popups for this site.");
      return;
    }

    newWindow.document.open();
    newWindow.document.write(html);
    newWindow.document.close();

    newWindow.onload = () => {
      newWindow.focus();
      setTimeout(() => {
        newWindow.print();
        newWindow.close();
      }, 50);
    };
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
      showPopup(
        "Sale refunded successfully! Stocks have been returned to the inventory.",
        "success"
      );
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
            <h2>Receipt</h2>
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
              <strong>Total:</strong> ₱{sale.totalAmount}
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
