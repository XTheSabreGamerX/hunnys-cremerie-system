import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { authFetch, API_BASE } from "../utils/tokenUtils";

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

  useEffect(() => {
    const init = async () => {
      const [sup, inv] = await Promise.all([
        authFetch(`${API_BASE}/api/suppliers`).then((r) => r.json()),
        authFetch(`${API_BASE}/api/inventory?all=true`).then((r) => r.json()),
      ]);
      setSuppliers(sup);
      setInventory(inv.items || []);
    };
    init();
  }, []);

  // Filter items based on supplier
  const filteredInventory = inventory.filter((item) => {
    if (!selectedSupplier) return item.suppliers.length === 0;
    return item.suppliers.some((s) => s.supplier?._id === selectedSupplier);
  });

  const handleAddItem = () => {
    const item = inventory.find((i) => i._id === itemInput.itemId);
    if (!item) return;

    setAddedItems((prev) => [
      ...prev,
      {
        itemId: item._id,
        name: item.name,
        orderedQty: Number(itemInput.orderedQty),
        purchasePrice: Number(itemInput.purchasePrice),
      },
    ]);
    setItemInput({ itemId: "", orderedQty: "", purchasePrice: "" });
  };

  const handleSubmit = async () => {
    if (addedItems.length === 0) return;
    setLoading(true);
    await onSave({
      supplier: selectedSupplier || null,
      items: addedItems.map((i) => ({
        item: i.itemId,
        orderedQty: i.orderedQty,
        purchasePrice: i.purchasePrice,
      })),
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Create Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">Non-Supplier (Generic)</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Add Items</h3>
            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-5">
                <select
                  value={itemInput.itemId}
                  onChange={(e) =>
                    setItemInput((p) => ({ ...p, itemId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">Select Item</option>
                  {filteredInventory.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="Qty"
                  value={itemInput.orderedQty}
                  onChange={(e) =>
                    setItemInput((p) => ({ ...p, orderedQty: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Price"
                  value={itemInput.purchasePrice}
                  onChange={(e) =>
                    setItemInput((p) => ({
                      ...p,
                      purchasePrice: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="col-span-2">
                <button
                  onClick={handleAddItem}
                  className="w-full py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark flex justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 mt-4">
              {addedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 bg-white border rounded-lg text-sm"
                >
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">x{item.orderedQty}</span>
                    <span className="font-mono">₱{item.purchasePrice}</span>
                    <button
                      onClick={() =>
                        setAddedItems((p) => p.filter((_, i) => i !== idx))
                      }
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || addedItems.length === 0}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create PO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
