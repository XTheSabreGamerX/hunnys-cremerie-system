import React, { useState, useEffect } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import { showToast } from "./ToastContainer";

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
    if (!selectedSupplier) return !hasSuppliers;
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
        setSuppliers(Array.isArray(supData) ? supData : []);

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

    // VALIDATION LOGIC
    if (!itemId) {
      showToast({ message: "Please select an item.", type: "error" });
      return;
    }
    if (!orderedQty || Number(orderedQty) <= 0) {
      showToast({ message: "Please enter a valid quantity.", type: "error" });
      return;
    }
    // If price is entered, it must be non-negative
    if (purchasePrice !== "" && Number(purchasePrice) < 0) {
      showToast({ message: "Price cannot be negative.", type: "error" });
      return;
    }

    const item = inventory.find((i) => i._id === itemId);
    if (!item) return;

    // Get final price (use manual input if provided, else 0)
    const finalPrice = Number(purchasePrice) || 0;

    setAddedItems((prev) => [
      ...prev,
      {
        itemId,
        name: item.name,
        orderedQty: Number(orderedQty),
        purchasePrice: finalPrice,
      },
    ]);

    // Reset Inputs
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
      showToast({ message: "Add at least one item.", type: "error" });
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
      showToast({ message: "Failed to create Purchase Order.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            Create Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Supplier Section */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white text-sm"
            >
              <option value="">Non-Supplier Items (Generic)</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Items Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">Add Items</h3>

            {/* Inputs Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 w-full">
                <select
                  value={itemInput.itemId}
                  onChange={(e) =>
                    setItemInput((prev) => ({
                      ...prev,
                      itemId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-primary outline-none"
                >
                  <option value="">Select Item</option>
                  {filteredInventory.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (Stock: {item.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <div className="w-20">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={itemInput.purchasePrice}
                    onChange={(e) =>
                      setItemInput((prev) => ({
                        ...prev,
                        purchasePrice: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center shrink-0 w-10"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Items Table */}
            {addedItems.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-600 text-xs font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-2">Item Name</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {addedItems.map((i, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-800 font-medium">
                          {i.name}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {i.orderedQty}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          ₱{i.purchasePrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-gray-800">
                          ₱{(i.orderedQty * i.purchasePrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Saving..." : "Create PO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
