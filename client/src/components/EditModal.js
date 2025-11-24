import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

const EditModal = ({
  item,
  fields,
  onSave,
  onClose,
  mode = "edit",
  modalType = "default",
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (mode === "edit" && item) {
      setFormData({ ...item });
    } else {
      setFormData({});
    }
  }, [mode, item]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {mode} {modalType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="editForm" onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}{" "}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === "select" ? (
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">-- Select --</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || "text"}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="editForm"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
