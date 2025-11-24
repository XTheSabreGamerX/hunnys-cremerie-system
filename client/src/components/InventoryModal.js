import React, { useState, useEffect } from "react";
import { customAlphabet } from "nanoid/non-secure";
import { X, Plus, Trash2, Star } from "lucide-react";
import { authFetch, API_BASE } from "../utils/tokenUtils";

const InventoryModal = ({
  isOpen,
  onClose,
  categories,
  uoms,
  suppliers,
  onItemAdded,
  mode = "add",
  item = null,
}) => {
  const [formData, setFormData] = useState({
    itemId: "",
    name: "",
    currentStock: 0,
    markup: 0,
    sellingPrice: 0,
    lastManualPrice: 0,
    category: "",
    unit: "",
    expirationDate: "",
    suppliers: [],
    note: "",
  });

  const [tempSupplier, setTempSupplier] = useState({
    supplier: "",
    purchasePrice: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nanoid = customAlphabet("0123456789", 6);

  // Initialize Data
  useEffect(() => {
    if (mode === "edit" && item) {
      const categoryId =
        categories.find((c) => c.name === item.category)?._id ||
        item.category ||
        "";
      const unitId = item.unit?._id || item.unit || "";
      const normalizedSuppliers =
        item.suppliers?.map((s) => ({
          supplier: s.supplier?._id || s.supplier || "",
          purchasePrice: s.purchasePrice,
          _id: s._id,
          isPreferred: s.isPreferred || false,
        })) || [];

      setFormData({
        ...item,
        category: categoryId,
        unit: unitId,
        suppliers: normalizedSuppliers,
        expirationDate: item.expirationDate
          ? new Date(item.expirationDate).toISOString().split("T")[0]
          : "",
        sellingPrice: item.lastManualPrice ?? item.sellingPrice,
      });
    }
  }, [mode, item, categories]);

  // Reset
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        itemId: "",
        name: "",
        currentStock: 0,
        markup: 0,
        sellingPrice: 0,
        lastManualPrice: 0,
        category: "",
        unit: "",
        expirationDate: "",
        suppliers: [],
        note: "",
      });
      setTempSupplier({ supplier: "", purchasePrice: 0 });
      setError("");
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "sellingPrice")
        updated.lastManualPrice = parseFloat(value) || 0;
      if (name === "markup") {
        updated.markup = parseFloat(value) || 0;
        const preferred = prev.suppliers.find((s) => s.isPreferred);
        if (preferred)
          updated.sellingPrice =
            preferred.purchasePrice * (1 + updated.markup / 100);
      }
      return updated;
    });
  };

  const handleAddSupplier = () => {
    if (!tempSupplier.supplier || tempSupplier.purchasePrice <= 0) return;
    setFormData((prev) => {
      const newSuppliers = [
        ...prev.suppliers,
        { ...tempSupplier, isPreferred: prev.suppliers.length === 0 },
      ];
      // Recalculate price if first supplier added
      const preferred = newSuppliers.find((s) => s.isPreferred);
      const newPrice = preferred
        ? preferred.purchasePrice * (1 + prev.markup / 100)
        : prev.sellingPrice;
      return { ...prev, suppliers: newSuppliers, sellingPrice: newPrice };
    });
    setTempSupplier({ supplier: "", purchasePrice: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url =
        mode === "edit"
          ? `${API_BASE}/api/inventory/${item._id}`
          : `${API_BASE}/api/inventory`;
      const method = mode === "edit" ? "PUT" : "POST";

      // Map ID back to Name for backend if needed, or send ID if backend updated
      const categoryName =
        categories.find((c) => c._id === formData.category)?.name || "";

      const payload = {
        ...formData,
        category: categoryName, // Backend expects Name string based on your controller
        threshold: Number(formData.currentStock), // Threshold = Stock logic from your controller
        itemId: mode === "add" ? `INV-${nanoid()}` : formData.itemId,
      };

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");

      onItemAdded(await res.json());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === "edit" ? "Edit Item" : "Add New Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form id="invForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  required
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                >
                  <option value="">Select Unit</option>
                  {uoms.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Markup (%)
                </label>
                <input
                  type="number"
                  min="0"
                  name="markup"
                  value={formData.markup}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (₱)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg outline-none font-bold text-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Suppliers */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                Suppliers
              </h3>
              <div className="flex gap-2 mb-3">
                <select
                  value={tempSupplier.supplier}
                  onChange={(e) =>
                    setTempSupplier((p) => ({ ...p, supplier: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 border rounded-lg outline-none bg-white"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Cost"
                  value={tempSupplier.purchasePrice}
                  onChange={(e) =>
                    setTempSupplier((p) => ({
                      ...p,
                      purchasePrice: Number(e.target.value),
                    }))
                  }
                  className="w-32 px-3 py-2 border rounded-lg outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {formData.suppliers.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                  >
                    <span className="font-medium text-gray-700">
                      {suppliers.find((sup) => sup._id === s.supplier)?.name ||
                        "Unknown"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">₱{s.purchasePrice}</span>
                      {s.isPreferred && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((p) => ({
                            ...p,
                            suppliers: p.suppliers.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {formData.suppliers.length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    No suppliers added.
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invForm"
            disabled={loading}
            className="px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
