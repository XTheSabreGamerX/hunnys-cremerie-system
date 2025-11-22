import React, { useState, useEffect } from "react";
import { showToast } from "../components/ToastContainer";
import "../styles/PurchaseOrderReceiveModal.css";

const PurchaseOrderReceiveModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSubmit,
}) => {
  const [items, setItems] = useState([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!purchaseOrder?.items) return;

    const prepared = purchaseOrder.items.map((poItem) => ({
      itemId: poItem.item._id,
      name: poItem.item.name,
      orderedQty: poItem.orderedQty,
      receivedQty: poItem.receivedQty,
      remainingQty: poItem.orderedQty - poItem.receivedQty,
      inputQty: "",
      expirationDate: "",
    }));
    setItems(prepared);
  }, [purchaseOrder]);

  // Validation
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasValidQty = items.some(
      (i) =>
        i.inputQty !== "" &&
        !isNaN(i.inputQty) &&
        Number(i.inputQty) > 0 &&
        Number(i.inputQty) <= i.remainingQty
    );

    const allDatesValid = items.every((i) => {
      if (!i.expirationDate) return true;

      const [year, month, day] = i.expirationDate.split("-").map(Number);
      const inputDate = new Date(year, month - 1, day);
      return inputDate > today;
    });

    setIsValid(hasValidQty && allDatesValid);
  }, [items]);

  if (!isOpen || !purchaseOrder) return null;

  const handleInput = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const submitReceive = () => {
    const payload = items
      .filter((i) => Number(i.inputQty) > 0)
      .map((i) => ({
        itemId: i.itemId,
        receivedQty: Number(i.inputQty),
        expirationDate: i.expirationDate || null,
      }));

    if (payload.length === 0) {
      showToast({
        message: `Please enter at least one received quantity.`,
        type: "warning",
        duration: 3000,
      });
      return;
    }

    onSubmit(payload);
  };

  return (
    <div className="receive-po-overlay">
      <div className="receive-po-modal">
        <div className="receive-po-header">
          <h2 className="receive-po-title">
            Receive Items – PO#{purchaseOrder.poNumber}
          </h2>
        </div>

        <div className="receive-po-body">
          <table className="receive-po-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Remaining</th>
                <th>Receive Now</th>
                <th>Expiration</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => {
                const qtyInvalid =
                  row.inputQty !== "" &&
                  (isNaN(row.inputQty) ||
                    Number(row.inputQty) < 0 ||
                    Number(row.inputQty) > row.remainingQty);

                return (
                  <tr key={row.itemId}>
                    <td>{row.name}</td>
                    <td>{row.orderedQty}</td>
                    <td>{row.receivedQty}</td>
                    <td>{row.remainingQty}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max={row.remainingQty}
                        value={row.inputQty}
                        onChange={(e) =>
                          handleInput(index, "inputQty", e.target.value)
                        }
                        className={`receive-po-input ${
                          qtyInvalid ? "invalid-input" : ""
                        }`}
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        value={row.expirationDate}
                        onChange={(e) =>
                          handleInput(index, "expirationDate", e.target.value)
                        }
                        className={`receive-po-expiration ${
                          row.expirationDate &&
                          new Date(row.expirationDate) <= new Date()
                            ? "invalid-input"
                            : ""
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="receive-po-footer">
          <button className="receive-po-cancel" onClick={onClose}>
            Cancel
          </button>

          <button
            className="receive-po-confirm"
            onClick={submitReceive}
            disabled={!isValid}
          >
            Receive Items
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderReceiveModal;
