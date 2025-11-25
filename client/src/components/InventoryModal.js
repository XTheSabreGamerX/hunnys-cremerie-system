import React, { useState, useEffect } from "react";
import { customAlphabet } from "nanoid/non-secure";
import { Plus, Trash2, Star, StarOff, X } from "lucide-react";
import { authFetch, API_BASE } from "../utils/tokenUtils";
import { showToast } from "./ToastContainer";

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

  const nanoid = customAlphabet("0123456789", 6);

  // ------------------------- EDIT MODE INITIALIZATION -------------------------
  useEffect(() => {
    if (mode === "edit" && item) {
      const categoryId =
        typeof item.category === "object"
          ? item.category?._id || ""
          : categories.find((c) => c.name === item.category)?._id ||
            item.category ||
            "";

      const unitId = item.unit?._id || item.unit?.$oid || item.unit || "";

      const normalizedSuppliers =
        item.suppliers?.map((s) => ({
          supplier: s.supplier?._id || s.supplier?.$oid || s.supplier || "",
          purchasePrice: s.purchasePrice,
          _id: s._id?.$oid || s._id,
          isPreferred: s.isPreferred || false,
        })) || [];

      const expirationDate = item.expirationDate?.$date
        ? item.expirationDate.$date.split("T")[0]
        : item.expirationDate?.split?.("T")[0] || "";

      setFormData({
        ...item,
        category: categoryId,
        unit: unitId,
        suppliers: normalizedSuppliers,
        expirationDate,
        sellingPrice: item.lastManualPrice ?? item.sellingPrice,
        lastManualPrice: item.lastManualPrice ?? item.sellingPrice,
      });
    } else {
      // Reset for Add Mode
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
    }
  }, [mode, item, categories, isOpen]);

  // ------------------------- ITEM ID GENERATION -------------------------
  useEffect(() => {
    if (
      mode === "add" &&
      formData.name &&
      formData.category &&
      !formData.itemId
    ) {
      const generateItemCode = (name, categoryName) => {
        const namePart = (name?.substring(0, 3) || "XXX").toUpperCase();
        const categoryPart = (
          categoryName?.substring(0, 3) || "XXX"
        ).toUpperCase();
        const randomPart = nanoid();
        return `${namePart}-${categoryPart}-${randomPart}`;
      };
      const categoryName =
        categories.find((c) => c._id === formData.category)?.name || "";
      setFormData((prev) => ({
        ...prev,
        itemId: generateItemCode(prev.name, categoryName),
      }));
    }
  }, [
    formData.name,
    formData.category,
    mode,
    categories,
    nanoid,
    formData.itemId,
  ]);

  // ------------------------- FORM VALIDATION -------------------------
  const isFormValid = () => {
    if (!formData.name.trim() || !formData.category || !formData.unit)
      return false;
    if (formData.currentStock < 0 || formData.sellingPrice < 0) return false;
    if (formData.suppliers.length === 0) return false;
    return true;
  };

  // ------------------------- INPUT CHANGE -------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "sellingPrice") {
        const typedPrice = parseFloat(value) || 0;
        updated.lastManualPrice = typedPrice;
      }

      if (name === "markup") {
        updated.markup = parseFloat(value) || 0;
        const preferred = prev.suppliers.find((s) => s.isPreferred);
        if (preferred) {
          updated.sellingPrice =
            preferred.purchasePrice * (1 + updated.markup / 100);
        }
      }

      return updated;
    });
  };

  // ------------------------- ADD / REMOVE SUPPLIER -------------------------
  const handleAddSupplier = () => {
    if (!tempSupplier.supplier || tempSupplier.purchasePrice <= 0) {
      showToast({ message: "Select supplier and valid price.", type: "error" });
      return;
    }
    if (formData.suppliers.some((s) => s.supplier === tempSupplier.supplier)) {
      showToast({ message: "Supplier already added.", type: "error" });
      return;
    }

    setFormData((prev) => {
      const updatedSuppliers = [
        ...prev.suppliers,
        { ...tempSupplier, isPreferred: prev.suppliers.length === 0 },
      ];
      const preferred = updatedSuppliers.find((s) => s.isPreferred);
      return {
        ...prev,
        suppliers: updatedSuppliers,
        sellingPrice: preferred
          ? preferred.purchasePrice * (1 + prev.markup / 100)
          : prev.sellingPrice,
      };
    });
    setTempSupplier({ supplier: "", purchasePrice: 0 });
  };

  const handleRemoveSupplier = (index) => {
    setFormData((prev) => {
      const updatedSuppliers = prev.suppliers.filter((_, i) => i !== index);
      if (
        !updatedSuppliers.some((s) => s.isPreferred) &&
        updatedSuppliers.length > 0
      ) {
        updatedSuppliers[0].isPreferred = true;
      }
      const preferred = updatedSuppliers.find((s) => s.isPreferred);
      return {
        ...prev,
        suppliers: updatedSuppliers,
        sellingPrice: preferred
          ? preferred.purchasePrice * (1 + prev.markup / 100)
          : prev.sellingPrice,
      };
    });
  };

  const handleSetPreferredSupplier = (index) => {
    setFormData((prev) => {
      const updatedSuppliers = prev.suppliers.map((s, i) => ({
        ...s,
        isPreferred: i === index,
      }));
      const preferred = updatedSuppliers.find((s) => s.isPreferred);
      return {
        ...prev,
        suppliers: updatedSuppliers,
        sellingPrice: preferred.purchasePrice * (1 + prev.markup / 100),
      };
    });
  };

  // ------------------------- SUBMIT -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = mode === "edit";
      const url = isEdit
        ? `${API_BASE}/api/inventory/${item._id}`
        : `${API_BASE}/api/inventory`;
      const method = isEdit ? "PUT" : "POST";

      const categoryName =
        categories.find((c) => c._id === formData.category)?.name || "";

      const payload = {
        ...formData,
        category: categoryName,
        threshold: 5,
        note: formData.note || "",
        sellingPrice: parseFloat(Number(formData.sellingPrice) || 0).toFixed(2),
        lastManualPrice: parseFloat(
          Number(formData.lastManualPrice) || 0
        ).toFixed(2),
      };

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save item");

      showToast({ message: "Item saved successfully!", type: "success" });
      onItemAdded?.(data);
      onClose?.();
    } catch (err) {
      showToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // CHANGED: Added z-[9999] to cover everything (including sidebar)
    // CHANGED: Adjusted p-4 to give spacing from screen edges
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* CHANGED: Reduced max-w-2xl to slightly narrower width and reduced internal padding */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        {/* CHANGED: Reduced vertical padding (py-3) */}
        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {mode === "edit" ? "Edit Inventory Item" : "Add Inventory Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {/* CHANGED: Reduced padding (p-5) and spacing (space-y-4) */}
        <div className="p-5 overflow-y-auto">
          <form id="invForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                placeholder="e.g. All Purpose Flour"
              />
            </div>

            {/* Row 2: Markup & Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Markup (%)
                </label>
                <input
                  type="number"
                  name="markup"
                  min="0"
                  max="100"
                  value={formData.markup}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Current Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="currentStock"
                  min="0"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 3: Price, Category, Unit */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Selling Price ₱ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-gray-50"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                >
                  <option value="">Select</option>
                  {uoms.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Expiration */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
            </div>

            {/* Row 5: Suppliers */}
            <div className="border-t border-gray-100 pt-3">
              <label className="block text-xs font-bold text-gray-800 mb-2">
                Suppliers <span className="text-red-500">*</span>
              </label>

              {/* Add Supplier Inputs */}
              <div className="flex gap-2 mb-2">
                <select
                  value={tempSupplier.supplier}
                  onChange={(e) =>
                    setTempSupplier((prev) => ({
                      ...prev,
                      supplier: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-primary"
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
                  placeholder="Cost"
                  min="0"
                  value={tempSupplier.purchasePrice}
                  onChange={(e) =>
                    setTempSupplier((prev) => ({
                      ...prev,
                      purchasePrice: Number(e.target.value),
                    }))
                  }
                  className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* List of Added Suppliers */}
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {formData.suppliers.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-1">
                    No suppliers added yet.
                  </p>
                ) : (
                  formData.suppliers.map((s, index) => {
                    const supplierName =
                      suppliers.find((sup) => sup._id === s.supplier)?.name ||
                      "Unknown";
                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs group hover:border-brand-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetPreferredSupplier(index)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                            title="Set as Preferred Supplier"
                          >
                            {s.isPreferred ? (
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-medium text-gray-700 truncate max-w-[150px]">
                            {supplierName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-gray-600 font-semibold">
                            ₱{s.purchasePrice.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplier(index)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Optional Note */}
            {mode === "edit" && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Edit Note
                </label>
                <textarea
                  name="note"
                  rows="2"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Reason for editing..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none"
                />
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        {/* CHANGED: Reduced padding (py-3) */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invForm"
            disabled={loading || !isFormValid()}
            className="px-6 py-2 text-sm bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading
              ? "Saving..."
              : mode === "edit"
              ? "Save Changes"
              : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
