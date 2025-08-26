import React from "react";
import "../styles/ReceiptModal.css";

const ReceiptModal = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    const printContents =
      document.getElementById("receipt-content")?.innerHTML || "";

    // Insert separators only at key sections
    const modifiedContents = printContents
      // Add separator before items section
      .replace(
        /<h3>Items<\/h3>/i,
        '<p style="text-align:center; margin:6px 4px;">----------------------------------------</p><h3>Items</h3>'
      )
      // Add separator after items list
      .replace(
        /<\/ul>/i,
        '</ul><p style="text-align:center; margin:6px 4px;">----------------------------------------</p>'
      )
      // Add separator before total
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

  return (
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
          <button onClick={handlePrint}>Print</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
