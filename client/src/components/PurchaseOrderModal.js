import React, { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa6";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import "../styles/PurchaseOrderModal.css";

const PurchaseOrderModal = ({ onClose, onSave }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [addedItems, setAddedItems] = useState([]);
  const [itemInput, setItemInput] = useState({
    itemId: "",
    orderedQty: "",
    purchasePrice: "",
  });
  const [loading, setLoading] = useState(false);

  // Filters inventory when a supplier is selected or not
  const filteredInventory = inventory.filter((item) => {
    const hasSuppliers = item.suppliers && item.suppliers.length > 0;

    if (!selectedSupplier) {
      return !hasSuppliers;
    }

    return item.suppliers.some((s) => s.supplier?._id === selectedSupplier);
  });

  // Clear items table whenever supplier changes
  useEffect(() => {
    setAddedItems([]);
  }, [selectedSupplier]);

  // Automatically fill in purchase price field if a supplier is selected
  useEffect(() => {
    if (!itemInput.itemId) {
      setItemInput((prev) => ({ ...prev, purchasePrice: "" }));
      return;
    }

    const item = inventory.find((i) => i._id === itemInput.itemId);
    if (!item) return;

    // Try to get supplier-specific purchase price
    let supplierPrice = "";
    if (selectedSupplier && item.suppliers?.length) {
      const supplierData = item.suppliers.find(
        (s) => s.supplier?._id === selectedSupplier
      );
      if (supplierData && supplierData.purchasePrice != null) {
        supplierPrice = supplierData.purchasePrice;
      }
    }

    setItemInput((prev) => ({
      ...prev,
      purchasePrice: supplierPrice || prev.purchasePrice || "",
    }));
  }, [itemInput.itemId, selectedSupplier, inventory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supRes = await authFetch(`${API_BASE}/api/suppliers`);
        const supData = await supRes.json();
        setSuppliers(supData);

        const invRes = await authFetch(`${API_BASE}/api/inventory?all=true`);
        const invData = await invRes.json();
        setInventory(invData.items || []);
      } catch (err) {
        console.error("Failed to fetch suppliers or inventory:", err);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    const { itemId, orderedQty, purchasePrice } = itemInput;
    if (!itemId || !orderedQty) return; // purchasePrice might come from supplier

    const item = inventory.find((i) => i._id === itemId);
    if (!item) return;

    // Get purchase price for selected supplier if available
    let finalPrice = Number(purchasePrice);
    if (selectedSupplier && item.suppliers?.length) {
      const supplierData = item.suppliers.find(
        (s) => s.supplier?._id === selectedSupplier
      );
      if (supplierData && supplierData.purchasePrice != null) {
        finalPrice = supplierData.purchasePrice;
      }
    }

    setAddedItems((prev) => [
      ...prev,
      {
        itemId,
        name: item.name,
        orderedQty: Number(orderedQty),
        purchasePrice: finalPrice,
      },
    ]);

    setItemInput({
      itemId: "",
      orderedQty: "",
      purchasePrice: "",
    });
  };

  const handleRemoveItem = (index) => {
    setAddedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (addedItems.length === 0) {
      alert("Add at least one item.");
      return;
    }

    const payload = {
      supplier: selectedSupplier || null,
      items: addedItems.map((i) => ({
        item: i.itemId,
        orderedQty: i.orderedQty,
        purchasePrice: i.purchasePrice,
      })),
    };

    setLoading(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Failed to create PO:", err);
      alert("Failed to create Purchase Order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="po-modal-overlay">
      <div className="po-modal">
        {/* Header */}
        <div className="po-modal-header">
          <h2>Create Purchase Order</h2>
        </div>

        {/* Supplier Section */}
        <div className="po-modal-body">
          <div className="po-modal-section">
            <label>Supplier:</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="">Non Supplier Items</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Items Section */}
          <div className="po-modal-section add-items-section">
            <h3>Add Items</h3>

            {/* Input Row */}
            <div className="po-item-inputs">
              <select
                value={itemInput.itemId}
                onChange={(e) =>
                  setItemInput((prev) => ({ ...prev, itemId: e.target.value }))
                }
              >
                <option value="">-- Select Item --</option>
                {filteredInventory.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} (Stock: {item.currentStock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                min="1"
                value={itemInput.orderedQty}
                onChange={(e) =>
                  setItemInput((prev) => ({
                    ...prev,
                    orderedQty: e.target.value,
                  }))
                }
              />

              <input
                type="number"
                placeholder="Purchase Price"
                min="0"
                step="0.01"
                value={itemInput.purchasePrice}
                onChange={(e) =>
                  setItemInput((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value,
                  }))
                }
              />

              <button
                type="button"
                className="po-add-item-btn"
                onClick={handleAddItem}
              >
                Add
              </button>
            </div>

            {/* Table */}
            {addedItems.length > 0 && (
              <div className="po-items-table">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedItems.map((i, idx) => (
                      <tr key={idx}>
                        <td>{i.name}</td>
                        <td>{i.orderedQty}</td>
                        <td>{i.purchasePrice}</td>
                        <td>
                          <button
                            type="button"
                            className="po-remove-item-btn"
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="po-modal-footer">
          <button
            className="po-save-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Create PO"}
          </button>
          <button className="po-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
